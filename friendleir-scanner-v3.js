    const TYPES = [
      { id: "F28-BASE", label: "28oz Base", stack: 108, icon: "📦", color: "#4A9FD8" },
      { id: "F38-BASE", label: "38oz Base", stack: 116, icon: "📦", color: "#4A9FD8" },
      { id: "F64-BASE", label: "64oz Base", stack: 107, icon: "📦", color: "#2E7FB8" },
      { id: "F32-CIRC", label: "32oz Circular", stack: 105, icon: "⭕", color: "#5BABD5" },
      { id: "F18-CIRC", label: "18oz Circular", stack: 106, icon: "⭕", color: "#5BABD5" },
      { id: "PLATES", label: "Plates 95", stack: 129, icon: "🍽️", color: "#27AE60" },
      { id: "F16R-B", label: "16oz Rect", stack: 25, icon: "📦", color: "#4A9FD8" },
      { id: "F48S3", label: "48oz Compartment", stack: 15, icon: "🍱", color: "#F39C12" },
      { id: "F12M-B", label: "12oz Coffee", stack: 25, icon: "☕", color: "#8E44AD" },
      { id: "F16CU", label: "16oz Cups", stack: 25, icon: "🥤", color: "#9B59B6" },
      { id: "C20CU", label: "Coca Cola Zoo", stack: 25, icon: "🥤", color: "#E74C3C" },
    ];

    const LID_TYPES = [
      { id: "F28-LID", label: "28/38oz Lids", stack: 20, icon: "🔲", color: "#4A9FD8", matchBases: ["F28-BASE", "F38-BASE"] },
      { id: "F64-LID", label: "64oz Lids", stack: 15, icon: "🔲", color: "#2E7FB8", matchBases: ["F64-BASE"] },
      { id: "F16R-LID", label: "16oz Lids", stack: 25, icon: "🔲", color: "#4A9FD8", matchBases: ["F16R-B"] },
      { id: "F32-LID", label: "32oz Circ Lids", stack: 20, icon: "🔲", color: "#5BABD5", matchBases: ["F32-CIRC"] },
      { id: "F18-LID", label: "18oz Circ Lids", stack: 20, icon: "🔲", color: "#5BABD5", matchBases: ["F18-CIRC"] },
    ];

    const ALL_TYPES = [...TYPES, ...LID_TYPES];

    let state = {
      operator: "",
      counts: {},
      log: [],
      selected: null,
      learnedMap: {},
      pendingUrl: null,
      editingIdx: null
    };

    ALL_TYPES.forEach(t => state.counts[t.id] = 0);

    const fmtTime = (d) => d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const fmtDate = () => new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    function addEntry(typeId, qty, method) {
      const t = ALL_TYPES.find(x => x.id === typeId);
      state.counts[typeId] = Math.max(0, (state.counts[typeId] || 0) + qty);
      state.log.push({ type: typeId, label: t?.label || typeId, qty, method, time: new Date(), operator: state.operator });
      flash(typeId);
      render();
    }

    function flash(id) {
      const el = document.getElementById("type-" + id) || document.getElementById("lid-" + id);
      if (el) {
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 500);
      }
    }

    function handleScan(e) {
      if (e.key !== "Enter" || !e.target.value.trim()) return;
      const url = e.target.value.trim();

      if (state.learnedMap[url]) {
        const typeId = state.learnedMap[url];
        const t = ALL_TYPES.find(x => x.id === typeId);
        addEntry(typeId, t?.stack || 1, "auto-scan");
        e.target.value = "";
        return;
      }

      if (state.selected) {
        const t = ALL_TYPES.find(x => x.id === state.selected);
        addEntry(state.selected, t?.stack || 1, "scan");
        state.learnedMap[url] = state.selected;
        e.target.value = "";
        render();
        return;
      }

      state.pendingUrl = url;
      e.target.value = "";
      render();
    }

    function render() {
      const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
      document.getElementById("totalCount").textContent = total.toLocaleString();
      document.getElementById("headerOperator").textContent = state.operator;

      const learnedCount = Object.keys(state.learnedMap).length;
      const learnedInfo = document.getElementById("learnedInfo");
      const footerLearned = document.getElementById("footerLearned");
      if (learnedCount > 0) {
        learnedInfo.innerHTML = `<div class="learn-badge">🧠 ${learnedCount} container${learnedCount !== 1 ? "s" : ""} learned — Auto-detection active</div>`;
        learnedInfo.classList.remove("hidden");
        footerLearned.textContent = `🧠 ${learnedCount} learned`;
      } else {
        learnedInfo.classList.add("hidden");
        footerLearned.textContent = "";
      }

      const scanInput = document.getElementById("scanInput");
      const scanLabel = document.getElementById("scanLabel");
      if (state.selected) {
        const t = TYPES.find(x => x.id === state.selected);
        scanInput.classList.remove("warn");
        scanInput.placeholder = "Scan QR code now...";
        scanLabel.textContent = `Step 2: Scan QR Code → Adding to ${t?.label}`;
      } else {
        scanInput.classList.add("warn");
        scanInput.placeholder = "Select a type above first, then scan...";
        scanLabel.textContent = "Step 2: Scan QR Code → Select type first or scan to learn";
      }

      ALL_TYPES.forEach(t => {
        const countEl = document.getElementById("count-" + t.id);
        if (countEl) {
          countEl.textContent = state.counts[t.id];
          countEl.className = state.counts[t.id] > 0 ? "type-count has" : "type-count empty";
        }
        const lidCountEl = document.getElementById("lid-count-" + t.id);
        if (lidCountEl) {
          lidCountEl.textContent = state.counts[t.id];
          lidCountEl.className = state.counts[t.id] > 0 ? "lid-count has" : "lid-count empty";
        }
      });

      document.getElementById("pendingOverlay").classList.toggle("hidden", !state.pendingUrl);
      document.getElementById("editOverlay").classList.toggle("hidden", state.editingIdx === null);
    }

    function renderTypeGrid() {
      const grid = document.getElementById("typeGrid");
      grid.innerHTML = "";
      TYPES.forEach(t => {
        const div = document.createElement("div");
        div.id = "type-" + t.id;
        div.className = "type-btn" + (state.selected === t.id ? " selected" : "");
        div.innerHTML = `
      ${state.selected === t.id ? '<div class="selected-badge">ACTIVE</div>' : ''}
      <div class="type-icon">${t.icon}</div>
      <div class="type-label">${t.label}</div>
      <div class="type-count empty" id="count-${t.id}">0</div>
      <div class="type-divider"></div>
      <div class="type-btns">
        <button class="btn-sub" data-action="sub" data-id="${t.id}" title="Remove 1 stack">−</button>
        <button class="btn-add" data-action="add" data-id="${t.id}" title="Add stacks">+ Stacks</button>
      </div>
    `;
        div.addEventListener("click", (e) => {
          if (e.target.tagName === "BUTTON") return;
          state.selected = state.selected === t.id ? null : t.id;
          render();
          renderTypeGrid();
          document.getElementById("scanInput").focus();
        });
        grid.appendChild(div);
      });

      document.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const t = ALL_TYPES.find(x => x.id === id);
          if (btn.dataset.action === "add") {
            openStackPicker(t, false);
          } else {
            openStackPicker(t, true);
          }
        });
      });
    }

    function renderLidGrid() {
      const grid = document.getElementById("lidGrid");
      grid.innerHTML = "";
      LID_TYPES.forEach(t => {
        const div = document.createElement("div");
        div.id = "lid-" + t.id;
        div.className = "lid-row";
        div.innerHTML = `
      <div>
        <div class="lid-label">${t.icon} ${t.label}</div>
        <div class="lid-sub">Stack = ${t.stack} units</div>
      </div>
      <div class="lid-controls">
        <button class="lid-btn-sub" data-action="sub" data-id="${t.id}">−</button>
        <div class="lid-count empty" id="lid-count-${t.id}">0</div>
        <button class="lid-btn-add" data-action="add" data-id="${t.id}">+ Stacks</button>
      </div>
    `;
        grid.appendChild(div);
      });

      document.querySelectorAll("#lidGrid [data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const t = LID_TYPES.find(x => x.id === id);
          if (btn.dataset.action === "add") {
            openStackPicker(t, false);
          } else {
            openStackPicker(t, true);
          }
        });
      });
    }

    function renderLog() {
      const summaryBox = document.getElementById("summaryBox");
      let html = `<div class="section-label">Summary — ${fmtDate()}</div>`;
      let hasAny = false;
      ALL_TYPES.forEach(t => {
        if (state.counts[t.id] > 0) {
          hasAny = true;
          html += `<div class="summary-row"><span style="font-weight:600;">${t.icon} ${t.label}</span><span style="font-weight:800; color:${t.color}">${state.counts[t.id]}</span></div>`;
        }
      });
      if (!hasAny) html += '<div style="color:#D1D9E0; font-size:14px; text-align:center; padding:20px;">No containers scanned yet</div>';
      const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
      html += `<div class="summary-total"><span>TOTAL</span><span>${total.toLocaleString()}</span></div>`;
      summaryBox.innerHTML = html;

      const logBox = document.getElementById("logBox");
      html = `<div class="section-label">Tap any entry to edit or delete · ${state.log.length} entries</div>`;
      if (state.log.length === 0) {
        html += '<div style="color:#D1D9E0; font-size:13px; text-align:center; padding:24px;">No scans yet — start scanning!</div>';
      }
      state.log.forEach((entry, i) => {
        const qtyStyle = entry.qty > 0 ? "color:#27AE60; font-weight:700;" : entry.qty < 0 ? "color:#E74C3C; font-weight:700;" : "color:#A5B0BC;";
        html += `<div class="log-entry" data-idx="${i}">
      <span style="font-size:11px; color:#A5B0BC; min-width:70px;">${fmtTime(entry.time)}</span>
      <span style="flex:1; font-weight:600; color:#1A2332; font-size:12px;">${entry.label}</span>
      <span style="${qtyStyle} min-width:50px; text-align:right; font-size:13px;">${entry.qty > 0 ? "+" : ""}${entry.qty}</span>
      <span style="font-size:9px; padding:2px 6px; background:#F0F3F5; border-radius:4px; color:#7B8794;">${entry.method}</span>
      ${entry.type !== "SYS" ? '<span style="font-size:11px; color:#4A9FD8;">✏️</span>' : ''}
    </div>`;
      });
      logBox.innerHTML = html;

      document.querySelectorAll(".log-entry").forEach(el => {
        el.addEventListener("click", () => {
          const idx = parseInt(el.dataset.idx);
          if (state.log[idx].type !== "SYS") {
            state.editingIdx = idx;
            document.getElementById("editLabel").textContent = state.log[idx].label;
            document.getElementById("editInput").value = state.log[idx].qty;
            render();
            setTimeout(() => document.getElementById("editInput").focus(), 100);
          }
        });
      });
    }

    // Stack Picker
    let pickerState = { type: null, stacks: 0, isSubtract: false };

    function openStackPicker(t, isSubtract) {
      pickerState = { type: t, stacks: 0, isSubtract };
      document.getElementById("pickerIconWrap").textContent = t.icon;
      document.getElementById("pickerTypeName").textContent = (isSubtract ? "Remove — " : "") + t.label;
      document.getElementById("pickerStackInfo").textContent = `1 stack = ${t.stack} containers`;
      document.getElementById("pickerDirection").textContent = isSubtract ? "⚠ This will subtract from the total" : "";
      updatePickerDisplay();
      document.getElementById("stackPickerOverlay").classList.remove("hidden");
    }

    function updatePickerDisplay() {
      const s = pickerState.stacks;
      const total = s * pickerState.type.stack;
      const stackEl = document.getElementById("pickerStackCount");
      stackEl.textContent = s;
      stackEl.classList.remove("bump");
      void stackEl.offsetWidth;
      stackEl.classList.add("bump");
      document.getElementById("pickerTotalContainers").textContent = total.toLocaleString();
      const okBtn = document.getElementById("pickerOkBtn");
      okBtn.disabled = s === 0;
      if (s > 0) {
        okBtn.style.background = pickerState.isSubtract ? "var(--red)" : "var(--green)";
        okBtn.textContent = pickerState.isSubtract
          ? `Remove ${total.toLocaleString()} containers`
          : `Add ${total.toLocaleString()} containers`;
      } else {
        okBtn.textContent = "Confirm";
        okBtn.style.background = "";
      }
    }

    document.querySelectorAll(".picker-ctrl-btn[data-delta]").forEach(btn => {
      btn.addEventListener("click", () => {
        const delta = parseInt(btn.dataset.delta);
        if (delta === 0) {
          pickerState.stacks = 0;
        } else {
          pickerState.stacks = Math.max(0, pickerState.stacks + delta);
        }
        updatePickerDisplay();
      });
    });

    document.getElementById("pickerCancelBtn").addEventListener("click", () => {
      document.getElementById("stackPickerOverlay").classList.add("hidden");
    });

    document.getElementById("pickerOkBtn").addEventListener("click", () => {
      if (pickerState.stacks === 0) return;
      const qty = pickerState.stacks * pickerState.type.stack;
      const method = pickerState.isSubtract ? "manual-sub" : "manual";
      addEntry(pickerState.type.id, pickerState.isSubtract ? -qty : qty, method);
      document.getElementById("stackPickerOverlay").classList.add("hidden");
    });

    // Login
    document.getElementById("operatorInput").addEventListener("input", (e) => {
      document.getElementById("startBtn").disabled = !e.target.value.trim();
    });

    document.getElementById("operatorInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        state.operator = e.target.value.trim();
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        renderTypeGrid();
        renderLidGrid();
        render();
        setTimeout(() => document.getElementById("scanInput").focus(), 100);
      }
    });

    document.getElementById("startBtn").addEventListener("click", () => {
      const val = document.getElementById("operatorInput").value.trim();
      if (val) {
        state.operator = val;
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        renderTypeGrid();
        renderLidGrid();
        render();
        setTimeout(() => document.getElementById("scanInput").focus(), 100);
      }
    });

    // Tabs
    document.querySelectorAll(".tab").forEach((tab, i) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        ["panel-scan", "panel-lids", "panel-log"].forEach((p, j) => {
          document.getElementById(p).classList.toggle("hidden", i !== j);
        });
        if (i === 0) setTimeout(() => document.getElementById("scanInput").focus(), 100);
        if (i === 2) renderLog();
      });
    });

    // Scan
    document.getElementById("scanInput").addEventListener("keydown", handleScan);

    // Pending overlay
    document.getElementById("cancelPendingBtn").addEventListener("click", () => {
      state.pendingUrl = null;
      render();
    });

    function renderPendingBtns() {
      const btns = document.getElementById("pendingBtns");
      btns.innerHTML = "";
      TYPES.forEach(t => {
        const btn = document.createElement("button");
        btn.style.cssText = "padding:12px 8px; background:white; border:2px solid #E5E9ED; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s;";
        btn.style.color = t.color;
        btn.innerHTML = `${t.icon}<br>${t.label}`;
        btn.addEventListener("mouseover", () => { btn.style.borderColor = t.color; btn.style.background = "#F8FAFB"; });
        btn.addEventListener("mouseout", () => { btn.style.borderColor = "#E5E9ED"; btn.style.background = "white"; });
        btn.addEventListener("click", () => {
          state.learnedMap[state.pendingUrl] = t.id;
          addEntry(t.id, t.stack, "learned-scan");
          state.pendingUrl = null;
          render();
        });
        btns.appendChild(btn);
      });
      document.getElementById("pendingUrl").textContent = state.pendingUrl;
    }

    // Edit overlay
    document.getElementById("saveEditBtn").addEventListener("click", () => {
      if (state.editingIdx === null) return;
      const newQty = parseInt(document.getElementById("editInput").value);
      if (isNaN(newQty)) return;
      const oldEntry = state.log[state.editingIdx];
      const diff = newQty - oldEntry.qty;
      state.counts[oldEntry.type] = Math.max(0, (state.counts[oldEntry.type] || 0) + diff);
      state.log[state.editingIdx].qty = newQty;
      state.log[state.editingIdx].method += " (edited)";
      state.editingIdx = null;
      render();
      renderLog();
    });

    document.getElementById("cancelEditBtn").addEventListener("click", () => {
      state.editingIdx = null;
      render();
    });

    document.getElementById("deleteEntryBtn").addEventListener("click", () => {
      if (state.editingIdx === null) return;
      const entry = state.log[state.editingIdx];
      state.counts[entry.type] = Math.max(0, (state.counts[entry.type] || 0) - entry.qty);
      state.log.splice(state.editingIdx, 1);
      state.editingIdx = null;
      render();
      renderLog();
    });

    document.getElementById("editInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("saveEditBtn").click();
    });

    // Auto-match lids
    document.getElementById("autoMatchBtn").addEventListener("click", () => {
      LID_TYPES.forEach(lid => {
        const baseTotal = lid.matchBases.reduce((sum, bId) => sum + (state.counts[bId] || 0), 0);
        state.counts[lid.id] = baseTotal;
      });
      state.log.push({ type: "SYS", label: "Lids auto-matched", qty: 0, method: "auto-match", time: new Date(), operator: state.operator });
      render();
    });

    // Export
    document.getElementById("exportBtn").addEventListener("click", () => {
      let csv = "Friendlier Wash Count," + fmtDate() + "\nOperator," + state.operator + "\n\nType,Count\n";
      ALL_TYPES.forEach(t => { if (state.counts[t.id] > 0) csv += t.label + "," + state.counts[t.id] + "\n"; });
      const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
      csv += "\nTOTAL," + total + "\n\nTime,Type,Qty,Method,Operator\n";
      state.log.forEach(e => { csv += fmtTime(e.time) + "," + e.label + "," + e.qty + "," + e.method + "," + (e.operator || "") + "\n"; });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "friendlier_wash_count_" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click();
    });

    // Reset
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("Reset all counts? This cannot be undone.")) return;
      ALL_TYPES.forEach(t => state.counts[t.id] = 0);
      state.log = [];
      render();
      renderLog();
    });

    // Switch operator
    document.getElementById("switchOpBtn").addEventListener("click", () => {
      document.getElementById("mainApp").classList.add("hidden");
      document.getElementById("loginScreen").classList.remove("hidden");
      document.getElementById("operatorInput").value = "";
      setTimeout(() => document.getElementById("operatorInput").focus(), 100);
    });

    // Watch for pending overlay
    setInterval(() => {
      if (state.pendingUrl && !document.getElementById("pendingOverlay").classList.contains("rendered")) {
        renderPendingBtns();
        document.getElementById("pendingOverlay").classList.add("rendered");
      }
      if (!state.pendingUrl) {
        document.getElementById("pendingOverlay").classList.remove("rendered");
      }
    }, 100);