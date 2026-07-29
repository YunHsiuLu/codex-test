const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
const DAY_INDEX = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };
const DAY_LABELS = { mon: "一", tue: "二", wed: "三", thu: "四", fri: "五" };

let data;
let semesters = [];
let mode = "substitute";
let pageView = "announcements";
let selected = { dayKey: "mon", period: 1 };
let swapScope = "same-week";
let crossSwap = { targetDate: "", targetPeriod: 1, candidate: null, error: "" };

const $ = (id) => document.getElementById(id);

function todayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateForDayKey(baseDate, dayKey) {
  if (!baseDate) return "";
  const date = new Date(`${baseDate}T00:00:00`);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setDate(monday.getDate() + DAY_INDEX[dayKey] - 1);
  return formatDate(monday);
}

function slotDate(dayKey) {
  return dateForDayKey($("scheduleDate").value, dayKey);
}

function nextWeekDate(dayKey) {
  const sourceDate = new Date(`${slotDate(dayKey)}T00:00:00`);
  sourceDate.setDate(sourceDate.getDate() + 7);
  return formatDate(sourceDate);
}

function clearCrossSwap() {
  crossSwap = { targetDate: "", targetPeriod: selected.period, candidate: null, error: "" };
}

function slotLabel(slot) {
  return `星期${slot.day} 第${slot.period}節 ${slot.time}`;
}

function eventSlotLabel(date, day, period, time) {
  return `${date}（星期${day}）第${period}節 ${time}`;
}

function getTeacher(name) {
  return data.teachers.find((teacher) => teacher.teacher === name);
}

function getSlot(entity, dayKey, period) {
  return entity.timetable[dayKey].find((slot) => slot.period === period);
}

function isFree(teacher, dayKey, period) {
  return !getSlot(teacher, dayKey, period).lesson;
}

function lessonText(slot) {
  return slot.lesson ? slot.lesson.raw : "空堂";
}

function adjustmentForSlot(teacherName, dayKey, period) {
  const date = slotDate(dayKey);
  return (data.adjustments || []).find((adjustment) => {
    if (adjustment.type === "substitute") {
      return (
        adjustment.date === date &&
        Number(adjustment.period) === period &&
        [adjustment.applicant, adjustment.substitute_teacher].includes(teacherName)
      );
    }
    if (adjustment.type === "swap") {
      const matchesOriginal = adjustment.date === date && Number(adjustment.period) === period;
      const matchesSwap = adjustment.swap_date === date && Number(adjustment.swap_period) === period;
      return (
        (matchesOriginal || matchesSwap) &&
        [adjustment.applicant, adjustment.swap_teacher].includes(teacherName)
      );
    }
    return false;
  });
}

function adjustmentLabel(adjustment) {
  return adjustment.type === "swap" ? "此時段已有調課" : "此時段已有代課";
}

function apiDatabase() {
  return encodeURIComponent($("semesterSelect").value);
}

function apiDate() {
  return encodeURIComponent($("scheduleDate").value || "");
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new Error("伺服器沒有回傳可讀取的資料。");
  }
  if (!response.ok || payload.error) {
    throw new Error(payload.error || "操作失敗");
  }
  return payload;
}

function setStatus(message, isError = false) {
  $("appStatus").textContent = message;
  $("appStatus").classList.toggle("error", isError);
}

function setLoading(isLoading, message = "") {
  const controlIds = ["semesterSelect", "scheduleDate", "teacherSelect", "domainFilter", "modeSub", "modeSwap"];
  controlIds.forEach((id) => {
    $(id).disabled = isLoading;
  });
  document.querySelectorAll("#quickActions button, #results button, #announcements button").forEach((button) => {
    button.disabled = isLoading;
  });
  $("timetable").setAttribute("aria-busy", String(isLoading));
  if (message) setStatus(message);
}

function classSlotsForTeacher(teacherName, dayKey, period) {
  return data.classes
    .map((klass) => ({ klass, slot: getSlot(klass, dayKey, period) }))
    .filter(({ slot }) => slot.lesson && slot.lesson.teacher.includes(teacherName));
}

function findSwapsForSlot(teacher, dayKey, period, limit = 80) {
  if (period === 8) return [];
  const teacherSlot = getSlot(teacher, dayKey, period);
  if (!teacherSlot.lesson) return [];

  const results = [];
  for (const { klass, slot: classSlot } of classSlotsForTeacher(teacher.teacher, dayKey, period)) {
    for (const otherDayKey of DAY_KEYS) {
      for (const otherClassSlot of klass.timetable[otherDayKey]) {
        const otherLesson = otherClassSlot.lesson;
        if (!otherLesson) continue;
        if (otherClassSlot.period === 8) continue;
        if (otherDayKey === dayKey && otherClassSlot.period === period) continue;
        if (!otherLesson.teacher || otherLesson.teacher === teacher.teacher) continue;

        const otherTeacher = getTeacher(otherLesson.teacher);
        if (!otherTeacher) continue;
        if (isFree(teacher, otherDayKey, otherClassSlot.period) && isFree(otherTeacher, dayKey, period)) {
          results.push({ klass, classSlot, otherClassSlot, otherTeacher });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}

function firstOccupiedSlot(teacher) {
  for (const dayKey of DAY_KEYS) {
    const slot = teacher.timetable[dayKey].find((item) => item.lesson);
    if (slot) return { dayKey, period: slot.period };
  }
  return { dayKey: "mon", period: 1 };
}

function renderTeacherOptions() {
  const currentValue = $("teacherSelect").value;
  const grouped = data.teachers.reduce((groups, teacher) => {
    const domain = teacher.domain || "未分類";
    groups[domain] = groups[domain] || [];
    groups[domain].push(teacher);
    return groups;
  }, {});
  $("teacherSelect").innerHTML = Object.keys(grouped)
    .sort()
    .map(
      (domain) => `
        <optgroup label="${domain}">
          ${grouped[domain]
            .map(
              (teacher) =>
                `<option value="${teacher.teacher}">${domain}｜${teacher.teacher}｜${teacher.teacher_code}</option>`,
            )
            .join("")}
        </optgroup>
      `,
    )
    .join("");
  const defaultTeacher = data.teachers.find((teacher) => teacher.teacher === "呂昀修");
  if (currentValue && getTeacher(currentValue)) {
    $("teacherSelect").value = currentValue;
  } else if (defaultTeacher) {
    $("teacherSelect").value = defaultTeacher.teacher;
  }
}

function renderDomainFilter(defaultDomain = "") {
  const currentValue = $("domainFilter").value;
  const domains = [...new Set(data.teachers.map((teacher) => teacher.domain).filter(Boolean))].sort();
  $("domainFilter").innerHTML =
    `<option value="">全部領域</option>` + domains.map((domain) => `<option value="${domain}">${domain}</option>`).join("");
  $("domainFilter").value = currentValue || defaultDomain;
}

function substituteTeacherOptions(applicant) {
  const domain = $("domainFilter").value;
  return data.teachers
    .filter(
      (teacher) =>
        teacher.teacher !== applicant.teacher &&
        (!domain || teacher.domain === domain) &&
        isFree(teacher, selected.dayKey, selected.period),
    )
    .map((teacher) => `<option value="${teacher.teacher}">${teacher.domain}｜${teacher.teacher}</option>`)
    .join("");
}

function renderStats(teacher) {
  $("teacherTitle").textContent = `${teacher.teacher} (${teacher.domain} ${teacher.teacher_code})`;
  $("stats").innerHTML = `
    <span><strong>${teacher.occupied_slots}</strong> 有課</span>
    <span><strong>${teacher.free_slots}</strong> 空堂</span>
    <span><strong>${teacher.summary.basic_hours}</strong> 基本</span>
    <span><strong>${teacher.summary.extra_hours}</strong> 兼課</span>
  `;
}

function renderTimetable() {
  const teacher = getTeacher($("teacherSelect").value);
  renderStats(teacher);

  const header = `
    <div class="corner"></div>
    ${data.days.map((day) => `<div class="day-head">星期${day}</div>`).join("")}
  `;
  const rows = data.periods
    .map((period) => {
      const cells = DAY_KEYS.map((dayKey) => {
        const slot = getSlot(teacher, dayKey, period.period);
        const active = selected.dayKey === dayKey && selected.period === period.period ? "active" : "";
        const empty = slot.lesson ? "" : "empty";
        const dateLabel = slotDate(dayKey);
        const adjustment = adjustmentForSlot(teacher.teacher, dayKey, period.period);
        const adjusted = adjustment ? `adjusted adjusted-${adjustment.type}` : "";
        const title = adjustment ? adjustmentLabel(adjustment) : "";
        return `
          <button class="slot ${active} ${empty} ${adjusted}" type="button" data-day="${dayKey}" data-period="${period.period}" title="${title}">
            <small>${dateLabel}</small>
            <span>${lessonText(slot)}</span>
          </button>
        `;
      }).join("");
      return `
        <div class="period-head">
          <strong>第${period.period}節</strong>
          <span>${period.time}</span>
        </div>
        ${cells}
      `;
    })
    .join("");

  $("timetable").innerHTML = header + rows;
  document.querySelectorAll(".slot").forEach((button) => {
    button.addEventListener("click", () => {
      selected = { dayKey: button.dataset.day, period: Number(button.dataset.period) };
      clearCrossSwap();
      renderTimetable();
      renderResults();
    });
  });
}

function renderModeButtons() {
  $("modeSub").classList.toggle("active", mode === "substitute");
  $("modeSwap").classList.toggle("active", mode === "swap");
  $("modeSub").setAttribute("aria-pressed", String(mode === "substitute"));
  $("modeSwap").setAttribute("aria-pressed", String(mode === "swap"));
}

function renderPageTabs() {
  const showingAdjustments = pageView === "adjustments";
  $("tabAdjustments").classList.toggle("active", showingAdjustments);
  $("tabAnnouncements").classList.toggle("active", !showingAdjustments);
  $("tabAdjustments").setAttribute("aria-selected", String(showingAdjustments));
  $("tabAnnouncements").setAttribute("aria-selected", String(!showingAdjustments));
  $("adjustmentWorkspace").hidden = !showingAdjustments;
  $("announcementPanel").hidden = showingAdjustments;
}

function renderQuickActions(teacher, slot) {
  if (!slot.lesson) {
    $("quickActions").innerHTML = "";
    return;
  }
  if (mode === "substitute") {
    const options = substituteTeacherOptions(teacher);
    if (!options) {
      $("quickActions").innerHTML = `<p class="muted action-hint">此時段沒有可登記的代課老師。</p>`;
      return;
    }
    $("quickActions").innerHTML = `
      <div class="action-box">
        <label class="field" for="substituteTeacher">
          <span>登記代課老師</span>
          <select id="substituteTeacher">${options}</select>
        </label>
        <label class="field" for="substituteNote">
          <span>備註</span>
          <input id="substituteNote" type="text" placeholder="可留空" />
        </label>
        <button id="addSubstitute" class="primary-action" type="button">登記代課</button>
      </div>
    `;
    $("addSubstitute").addEventListener("click", createSubstitute);
  } else {
    const scopeButtons = `
      <div class="segmented swap-scope" role="group" aria-label="調課範圍">
        <button id="sameWeekSwap" class="${swapScope === "same-week" ? "active" : ""}" type="button">同週調課</button>
        <button id="crossDateSwap" class="${swapScope === "cross-date" ? "active" : ""}" type="button">跨日期調課</button>
      </div>
    `;
    if (swapScope === "same-week") {
      $("quickActions").innerHTML = `${scopeButtons}<p class="muted action-hint">從下方同班級調課建議中選擇一筆登記。</p>`;
    } else {
      const targetDate = crossSwap.targetDate || nextWeekDate(selected.dayKey);
      const targetPeriod = crossSwap.targetPeriod || selected.period;
      const periodOptions = data.periods
        .filter((period) => period.period !== 8)
        .map(
          (period) =>
            `<option value="${period.period}" ${period.period === targetPeriod ? "selected" : ""}>第${period.period}節 ${period.time}</option>`,
        )
        .join("");
      $("quickActions").innerHTML = `
        ${scopeButtons}
        <div class="action-box">
          <label class="field" for="crossSwapDate">
            <span>互換日期</span>
            <input id="crossSwapDate" type="date" value="${targetDate}" />
          </label>
          <label class="field" for="crossSwapPeriod">
            <span>互換節次</span>
            <select id="crossSwapPeriod">${periodOptions}</select>
          </label>
          <button id="findCrossSwap" class="primary-action" type="button">查詢可交換課程</button>
        </div>
      `;
      $("crossSwapDate").addEventListener("change", (event) => {
        crossSwap = { ...crossSwap, targetDate: event.target.value, candidate: null, error: "" };
      });
      $("crossSwapPeriod").addEventListener("change", (event) => {
        crossSwap = { ...crossSwap, targetPeriod: Number(event.target.value), candidate: null, error: "" };
      });
      $("findCrossSwap").addEventListener("click", findCrossSwap);
    }
    $("sameWeekSwap").addEventListener("click", () => setSwapScope("same-week"));
    $("crossDateSwap").addEventListener("click", () => setSwapScope("cross-date"));
  }
}

function setSwapScope(scope) {
  swapScope = scope;
  clearCrossSwap();
  renderResults();
}

function renderSubstitutes(teacher) {
  $("resultTitle").textContent = "代課登記";
  $("results").innerHTML = "";
}

function renderSwaps(teacher, slot) {
  if (swapScope === "cross-date") {
    renderCrossDateSwap(slot);
    return;
  }
  $("resultTitle").textContent = "同週調課";
  if (selected.period === 8) {
    $("results").innerHTML = `<p class="empty-state">第八節不可作為調課選項。</p>`;
    return;
  }
  if (!slot.lesson) {
    $("results").innerHTML = `<p class="empty-state">此時段為空堂。</p>`;
    return;
  }

  const swaps = findSwapsForSlot(teacher, selected.dayKey, selected.period);
  $("results").innerHTML =
    swaps
      .map(
        ({ klass, classSlot, otherClassSlot, otherTeacher }, index) => `
          <article class="swap-card">
            <div class="swap-title">
              <strong>${klass.class}</strong>
              <span>${otherTeacher.teacher}｜${otherTeacher.domain}</span>
            </div>
            <p>原時段：${eventSlotLabel(slotDate(selected.dayKey), classSlot.day, classSlot.period, classSlot.time)}｜${lessonText(classSlot)}</p>
            <p>可交換：${eventSlotLabel(slotDate(otherClassSlot.day_key), otherClassSlot.day, otherClassSlot.period, otherClassSlot.time)}｜${lessonText(otherClassSlot)}</p>
            <button class="secondary-action" type="button" data-swap-index="${index}">登記調課</button>
          </article>
        `,
      )
      .join("") || `<p class="empty-state">已切換至調課模式。這堂課目前沒有同班級且雙方互相空堂的可交換組合，請點選其他有課時段。</p>`;

  document.querySelectorAll("[data-swap-index]").forEach((button) => {
    button.addEventListener("click", () => createSwap(swaps[Number(button.dataset.swapIndex)]));
  });
}

function renderCrossDateSwap(slot) {
  $("resultTitle").textContent = "跨日期調課";
  if (selected.period === 8) {
    $("results").innerHTML = `<p class="empty-state">第八節不可作為調課時段。</p>`;
    return;
  }
  if (!slot.lesson) {
    $("results").innerHTML = `<p class="empty-state">此時段為空堂。</p>`;
    return;
  }
  if (crossSwap.error) {
    $("results").innerHTML = `<p class="empty-state">${crossSwap.error}</p>`;
    return;
  }
  if (!crossSwap.candidate) {
    $("results").innerHTML = `<p class="empty-state">選擇互換日期與節次後，系統會檢查同一班級的課程，以及兩位老師在兩個實際時段是否互相空堂。</p>`;
    return;
  }
  const candidate = crossSwap.candidate;
  $("results").innerHTML = `
    <article class="swap-card">
      <div class="swap-title">
        <strong>${candidate.lesson.class}</strong>
        <span>${candidate.swap_teacher}</span>
      </div>
      <p>原時段：${eventSlotLabel(candidate.date, candidate.day, candidate.period, candidate.time)}｜${candidate.lesson.raw}</p>
      <p>互換時段：${eventSlotLabel(candidate.swap_date, candidate.swap_day, candidate.swap_period, candidate.swap_time)}｜${candidate.swap_lesson.raw}</p>
      <button id="addCrossDateSwap" class="secondary-action" type="button">登記跨日期調課</button>
    </article>
  `;
  $("addCrossDateSwap").addEventListener("click", createCrossDateSwap);
}

function renderResults() {
  const teacher = getTeacher($("teacherSelect").value);
  const slot = getSlot(teacher, selected.dayKey, selected.period);
  $("selectedSlot").textContent = eventSlotLabel(slotDate(selected.dayKey), slot.day, slot.period, slot.time);
  $("selectedLesson").innerHTML = slot.lesson
    ? `<strong>${slot.lesson.subject}</strong><span>${slot.lesson.class || "未標示班級"}</span>`
    : `<strong>空堂</strong><span></span>`;
  renderQuickActions(teacher, slot);

  if (mode === "substitute") {
    renderSubstitutes(teacher);
  } else {
    renderSwaps(teacher, slot);
  }
}

async function createSubstitute() {
  const teacher = getTeacher($("teacherSelect").value);
  const payload = {
    type: "substitute",
    date: slotDate(selected.dayKey),
    period: selected.period,
    applicant: teacher.teacher,
    substitute_teacher: $("substituteTeacher").value,
    note: $("substituteNote").value,
  };
  try {
    setLoading(true, "正在登記代課……");
    await apiFetch(`/api/adjustments?database=${apiDatabase()}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadSelectedSemester("代課已登記，課表與公告已更新。");
  } catch (error) {
    setStatus(`代課未登記：${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

async function createSwap(swap) {
  const teacher = getTeacher($("teacherSelect").value);
  const payload = {
    type: "swap",
    date: slotDate(selected.dayKey),
    period: selected.period,
    applicant: teacher.teacher,
    swap_date: slotDate(swap.otherClassSlot.day_key),
    swap_period: swap.otherClassSlot.period,
    swap_teacher: swap.otherTeacher.teacher,
  };
  try {
    setLoading(true, "正在登記調課……");
    await apiFetch(`/api/adjustments?database=${apiDatabase()}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadSelectedSemester("調課已登記，課表與公告已更新。");
  } catch (error) {
    setStatus(`調課未登記：${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

async function findCrossSwap() {
  const teacher = getTeacher($("teacherSelect").value);
  const targetDate = $("crossSwapDate").value;
  const targetPeriod = Number($("crossSwapPeriod").value);
  try {
    setLoading(true, "正在查詢跨日期可交換課程……");
    const params = new URLSearchParams({
      database: $("semesterSelect").value,
      date: slotDate(selected.dayKey),
      period: String(selected.period),
      applicant: teacher.teacher,
      swap_date: targetDate,
      swap_period: String(targetPeriod),
    });
    const candidate = await apiFetch(`/api/cross-swap-candidate?${params}`);
    crossSwap = { targetDate, targetPeriod, candidate, error: "" };
    renderResults();
    setStatus("已找到可登記的跨日期調課組合。");
  } catch (error) {
    crossSwap = { targetDate, targetPeriod, candidate: null, error: `無法建立這個跨日期調課：${error.message}` };
    renderResults();
    setStatus(`跨日期查詢失敗：${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

async function createCrossDateSwap() {
  if (!crossSwap.candidate) return;
  const candidate = crossSwap.candidate;
  const payload = {
    type: "swap",
    date: candidate.date,
    period: candidate.period,
    applicant: candidate.applicant,
    swap_date: candidate.swap_date,
    swap_period: candidate.swap_period,
    swap_teacher: candidate.swap_teacher,
  };
  try {
    setLoading(true, "正在登記跨日期調課……");
    await apiFetch(`/api/adjustments?database=${apiDatabase()}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    clearCrossSwap();
    await loadSelectedSemester("跨日期調課已登記，課表與公告已更新。");
  } catch (error) {
    setStatus(`跨日期調課未登記：${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

async function cancelAdjustment(id) {
  try {
    setLoading(true, "正在撤銷調代課……");
    await apiFetch(`/api/adjustments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadSelectedSemester("調代課已撤銷。");
  } catch (error) {
    setStatus(`撤銷失敗：${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

function renderAnnouncements() {
  const announcements = data.announcements || [];
  $("announcements").innerHTML =
    announcements
      .map((item) => {
        const typeLabel = item.type === "swap" ? "調課" : "代課";
        const detail =
          item.type === "swap"
            ? `
              <p>原時段：${eventSlotLabel(item.date, item.day, item.period, item.time)}｜${item.lesson.raw}</p>
              <p>互換：${eventSlotLabel(item.swap_date, item.swap_day, item.swap_period, item.swap_time)}｜${item.swap_lesson.raw}</p>
              <p>申請人：${item.applicant}｜調課老師：${item.swap_teacher}</p>
            `
            : `
              <p>代課時間：${eventSlotLabel(item.date, item.day, item.period, item.time)}｜${item.lesson.raw}</p>
              <p>申請人：${item.applicant}｜代課老師：${item.substitute_teacher}</p>
            `;
        return `
          <article class="announcement-card">
            <div class="announcement-title">
              <strong>${typeLabel}</strong>
              <button class="danger-action" type="button" data-cancel-id="${item.id}">撤銷</button>
            </div>
            ${detail}
            ${item.note ? `<p class="muted">備註：${item.note}</p>` : ""}
          </article>
        `;
      })
      .join("") || `<p class="empty-state">目前沒有未來的調代課公告。</p>`;

  document.querySelectorAll("[data-cancel-id]").forEach((button) => {
    button.addEventListener("click", () => cancelAdjustment(button.dataset.cancelId));
  });
}

async function init() {
  $("scheduleDate").value = todayString();
  $("tabAdjustments").addEventListener("click", () => {
    pageView = "adjustments";
    renderPageTabs();
  });
  $("tabAnnouncements").addEventListener("click", () => {
    pageView = "announcements";
    renderPageTabs();
  });
  $("semesterSelect").addEventListener("change", () => loadSelectedSemester());
  $("scheduleDate").addEventListener("change", () => {
    clearCrossSwap();
    loadSelectedSemester();
  });
  $("teacherSelect").addEventListener("change", () => {
    const teacher = getTeacher($("teacherSelect").value);
    $("domainFilter").value = teacher.domain || "";
    selected = firstOccupiedSlot(teacher);
    clearCrossSwap();
    renderTimetable();
    renderResults();
  });
  $("domainFilter").addEventListener("change", renderResults);
  $("modeSub").addEventListener("click", () => {
    mode = "substitute";
    renderModeButtons();
    renderResults();
    setStatus("已切換至代課模式。請選擇代課老師後登記。");
  });
  $("modeSwap").addEventListener("click", () => {
    mode = "swap";
    swapScope = "same-week";
    clearCrossSwap();
    renderModeButtons();
    renderResults();
    setStatus("已切換至調課模式。可選擇同週或跨日期調課。");
  });

  await loadSemesters();
  await loadSelectedSemester("課表已載入。");
  renderPageTabs();
}

async function loadSemesters() {
  try {
    const payload = await fetch("semesters.json").then((response) => response.json());
    semesters = payload.semesters || [];
  } catch (_error) {
    semesters = [{ id: "current", label: "目前資料", database: "schedule_database.json" }];
  }
  if (!semesters.length) {
    semesters = [{ id: "current", label: "目前資料", database: "schedule_database.json" }];
  }
  $("semesterSelect").innerHTML = semesters
    .map((semester) => `<option value="${semester.database}">${semester.label}</option>`)
    .join("");
}

async function loadSelectedSemester(successMessage = "課表已更新。") {
  setLoading(true, "正在載入課表……");
  try {
    data = await apiFetch(`/api/schedule?database=${apiDatabase()}&date=${apiDate()}`);
    $("sourceLabel").textContent =
      `${data.source_dir}｜${data.metadata.teacher_count} 位老師｜${data.metadata.class_count} 班`;
    renderTeacherOptions();
    const selectedTeacher = getTeacher($("teacherSelect").value);
    renderDomainFilter(selectedTeacher.domain || "");
    if (!getSlot(selectedTeacher, selected.dayKey, selected.period).lesson) {
      selected = firstOccupiedSlot(selectedTeacher);
    }
    renderModeButtons();
    renderTimetable();
    renderResults();
    renderAnnouncements();
    setStatus(successMessage);
  } catch (error) {
    $("timetable").innerHTML = "";
    $("quickActions").innerHTML = "";
    $("results").innerHTML = `<p class="empty-state">無法載入課表，請確認系統已用 start.sh 啟動。</p>`;
    setStatus(`課表載入失敗：${error.message}`, true);
    throw error;
  } finally {
    setLoading(false);
  }
}

init().catch((error) => {
  console.error(error);
});
