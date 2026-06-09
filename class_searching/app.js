const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];

let data;
let semesters = [];
let mode = "substitute";
let selected = { dayKey: "mon", period: 1 };

const $ = (id) => document.getElementById(id);

function slotLabel(slot) {
  return `星期${slot.day} 第${slot.period}節 ${slot.time}`;
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
  if (defaultTeacher) $("teacherSelect").value = defaultTeacher.teacher;
}

function renderDomainFilter() {
  const domains = [...new Set(data.teachers.map((teacher) => teacher.domain).filter(Boolean))].sort();
  $("domainFilter").innerHTML =
    `<option value="">全部領域</option>` + domains.map((domain) => `<option value="${domain}">${domain}</option>`).join("");
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
        return `
          <button class="slot ${active} ${empty}" type="button" data-day="${dayKey}" data-period="${period.period}">
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
      renderTimetable();
      renderResults();
    });
  });
}

function renderModeButtons() {
  $("modeSub").classList.toggle("active", mode === "substitute");
  $("modeSwap").classList.toggle("active", mode === "swap");
}

function renderSubstitutes(teacher, slot) {
  const domain = $("domainFilter").value;
  const candidates = data.teachers.filter(
    (candidate) =>
      candidate.teacher !== teacher.teacher &&
      (!domain || candidate.domain === domain) &&
      isFree(candidate, selected.dayKey, selected.period),
  );
  $("resultTitle").textContent = "可代課老師";
  $("results").innerHTML =
    candidates
      .map(
        (candidate) => `
          <article class="result-row">
            <strong>${candidate.teacher}</strong>
            <span>${candidate.domain}｜${candidate.teacher_code}</span>
          </article>
        `,
      )
      .join("") || `<p class="empty-state">此時段沒有其他空堂老師。</p>`;
}

function renderSwaps(teacher, slot) {
  $("resultTitle").textContent = "同班級調課";
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
        ({ klass, classSlot, otherClassSlot, otherTeacher }) => `
          <article class="swap-card">
            <div class="swap-title">
              <strong>${klass.class}</strong>
              <span>${otherTeacher.teacher}｜${otherTeacher.domain}</span>
            </div>
            <p>原時段：${slotLabel(classSlot)}｜${lessonText(classSlot)}</p>
            <p>可交換：${slotLabel(otherClassSlot)}｜${lessonText(otherClassSlot)}</p>
            <p class="muted">單週：兩門課直接交換。隔週：A週使用可交換時段上原課，B週使用原時段上對方課。</p>
          </article>
        `,
      )
      .join("") || `<p class="empty-state">沒有找到同班級且雙方互相空堂的調課組合。</p>`;
}

function renderResults() {
  const teacher = getTeacher($("teacherSelect").value);
  const slot = getSlot(teacher, selected.dayKey, selected.period);
  $("selectedSlot").textContent = slotLabel(slot);
  $("selectedLesson").innerHTML = slot.lesson
    ? `<strong>${slot.lesson.subject}</strong><span>${slot.lesson.class || "未標示班級"}</span>`
    : `<strong>空堂</strong><span></span>`;

  if (mode === "substitute") {
    renderSubstitutes(teacher, slot);
  } else {
    renderSwaps(teacher, slot);
  }
}

async function init() {
  await loadSemesters();
  await loadSelectedSemester();

  $("semesterSelect").addEventListener("change", async () => {
    await loadSelectedSemester();
    renderModeButtons();
    renderTimetable();
    renderResults();
  });
  $("teacherSelect").addEventListener("change", () => {
    selected = firstOccupiedSlot(getTeacher($("teacherSelect").value));
    renderTimetable();
    renderResults();
  });
  $("domainFilter").addEventListener("change", renderResults);
  $("modeSub").addEventListener("click", () => {
    mode = "substitute";
    renderModeButtons();
    renderResults();
  });
  $("modeSwap").addEventListener("click", () => {
    mode = "swap";
    renderModeButtons();
    renderResults();
  });
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

async function loadSelectedSemester() {
  data = await fetch($("semesterSelect").value).then((response) => response.json());
  $("sourceLabel").textContent =
    `${data.source_dir}｜${data.metadata.teacher_count} 位老師｜${data.metadata.class_count} 班`;
  renderTeacherOptions();
  renderDomainFilter();
  selected = firstOccupiedSlot(getTeacher($("teacherSelect").value));
  renderModeButtons();
  renderTimetable();
  renderResults();
}

init().catch((error) => {
  document.body.innerHTML = `<pre>${error.stack || error}</pre>`;
});
