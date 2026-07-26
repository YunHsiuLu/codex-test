"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Role = "teacher" | "student" | "guardian";
type Category = "班務" | "作業" | "活動" | "考試";
type Filter = "all" | "unread" | "archived";
type ServerView = "active" | "archived";

type Attachment = {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  category: Category;
  authorName: string;
  publishedAt: string;
  isPinned: boolean;
  requiresRead: boolean;
  expiresAt: string | null;
  hasRead?: boolean;
  readReceiptCount?: number;
  attachments: Attachment[];
};

type BulletinResponse = {
  viewer: { role: Role; displayName: string };
  announcements: Announcement[];
};

type BulletinViewer = BulletinResponse["viewer"] & {
  classId: number;
};

type ClassSummary = {
  id: number;
  schoolYear: string;
  name: string;
  role: Role;
};

type ClassListResponse = {
  viewer: { displayName: string };
  classes: ClassSummary[];
};

type CreatedAnnouncementResponse = {
  announcement: { id: number };
};

type ClassEvent = {
  id: number;
  title: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  description: string;
};

type ClassEventsResponse = {
  events: ClassEvent[];
};

type ClassResource = {
  id: number;
  title: string;
  url: string;
  category: "課程" | "表單" | "相簿" | "其他";
};

type ClassResourceFile = {
  id: number;
  title: string;
  category: "課程" | "表單" | "相簿" | "其他";
  originalName: string;
  sizeBytes: number;
};

type ClassResourcesResponse = {
  resources: ClassResource[];
  files: ClassResourceFile[];
};

const acceptedAttachmentTypes = ".pdf,.txt,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx";

const categoryClass: Record<Category, string> = {
  班務: "tag tag-blue",
  作業: "tag tag-purple",
  活動: "tag tag-amber",
  考試: "tag tag-rose",
};

function messageFromResponse(body: unknown, fallback: string) {
  if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間未提供";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "?", month: "日期未提供" };
  return {
    day: new Intl.DateTimeFormat("zh-TW", { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat("zh-TW", { month: "numeric" }).format(date),
  };
}

function formatEventDetails(event: ClassEvent) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const time = Number.isNaN(start.getTime())
    ? "時間未提供"
    : new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(start);
  const endTime = end && !Number.isNaN(end.getTime())
    ? `－${new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(end)}`
    : "";
  return `${time}${endTime}${event.location ? `　${event.location}` : ""}`;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const part = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function BulletinBoard() {
  // 公告請求是非同步的；保留它所屬班級，避免切班期間沿用上一班的身分。
  const [bulletinViewer, setBulletinViewer] = useState<BulletinViewer | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [resources, setResources] = useState<ClassResource[]>([]);
  const [resourceFiles, setResourceFiles] = useState<ClassResourceFile[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingAnnouncementEdit, setSavingAnnouncementEdit] = useState(false);
  const [pendingAction, setPendingAction] = useState<number | null>(null);
  const [uploadingAnnouncementId, setUploadingAnnouncementId] = useState<number | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventComposerOpen, setEventComposerOpen] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [savingEventEdit, setSavingEventEdit] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceComposerOpen, setResourceComposerOpen] = useState(false);
  const [savingResource, setSavingResource] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<number | null>(null);
  const [resourceFileComposerOpen, setResourceFileComposerOpen] = useState(false);
  const [savingResourceFile, setSavingResourceFile] = useState(false);
  const [deletingResourceFileId, setDeletingResourceFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const announcementRequestSequence = useRef(0);
  const eventRequestSequence = useRef(0);
  const resourceRequestSequence = useRef(0);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const attachmentTargetId = useRef<number | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/classes", {
        headers: { Accept: "application/json" },
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法讀取班級，請稍後再試。"));
      const data = body as ClassListResponse;
      setDisplayName(data.viewer.displayName);
      setClasses(data.classes);
      setSelectedClassId((currentId) => data.classes.some((item) => item.id === currentId)
        ? currentId
        : data.classes[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法讀取班級，請稍後再試。");
      setClasses([]);
      setSelectedClassId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const fetchAnnouncements = useCallback(async (classId: number, view: ServerView = "active") => {
    const requestSequence = ++announcementRequestSequence.current;
    setIsLoading(true);
    setError(null);
    // 切換班級後不可沿用上一班的畫面資料，即使新請求仍在進行中。
    setAnnouncements([]);
    try {
      const response = await fetch(`/api/classes/${classId}/announcements?view=${view}`, {
        headers: { Accept: "application/json" },
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法讀取公告，請稍後再試。"));
      if (requestSequence !== announcementRequestSequence.current) return false;
      const data = body as BulletinResponse;
      setBulletinViewer({ ...data.viewer, classId });
      setDisplayName(data.viewer.displayName);
      setAnnouncements(data.announcements);
      return true;
    } catch (requestError) {
      if (requestSequence !== announcementRequestSequence.current) return false;
      setError(requestError instanceof Error ? requestError.message : "無法讀取公告，請稍後再試。");
      return false;
    } finally {
      if (requestSequence === announcementRequestSequence.current) setIsLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (classId: number) => {
    const requestSequence = ++eventRequestSequence.current;
    setEventsLoading(true);
    setEvents([]);
    try {
      const response = await fetch(`/api/classes/${classId}/events`, { headers: { Accept: "application/json" } });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法讀取班級行事，請稍後再試。"));
      if (requestSequence !== eventRequestSequence.current) return;
      setEvents((body as ClassEventsResponse).events);
    } catch (requestError) {
      if (requestSequence !== eventRequestSequence.current) return;
      setEvents([]);
      setError(requestError instanceof Error ? requestError.message : "無法讀取班級行事，請稍後再試。");
    } finally {
      if (requestSequence === eventRequestSequence.current) setEventsLoading(false);
    }
  }, []);

  const fetchResources = useCallback(async (classId: number) => {
    const requestSequence = ++resourceRequestSequence.current;
    setResourcesLoading(true);
    setResources([]);
    setResourceFiles([]);
    try {
      const response = await fetch(`/api/classes/${classId}/resources`, { headers: { Accept: "application/json" } });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法讀取班級資源，請稍後再試。"));
      if (requestSequence !== resourceRequestSequence.current) return;
      const data = body as ClassResourcesResponse;
      setResources(data.resources);
      setResourceFiles(data.files);
    } catch (requestError) {
      if (requestSequence !== resourceRequestSequence.current) return;
      setResources([]);
      setResourceFiles([]);
      setError(requestError instanceof Error ? requestError.message : "無法讀取班級資源，請稍後再試。");
    } finally {
      if (requestSequence === resourceRequestSequence.current) setResourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId === null) return;
    setFilter("all");
    setComposerOpen(false);
    setEditingAnnouncementId(null);
    setEventComposerOpen(false);
    setEditingEventId(null);
    setResourceComposerOpen(false);
    setResourceFileComposerOpen(false);
    void fetchAnnouncements(selectedClassId);
    void fetchEvents(selectedClassId);
    void fetchResources(selectedClassId);
  }, [fetchAnnouncements, fetchEvents, fetchResources, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  // 班級清單與公告 API 都由伺服器驗證成員關係。公告回應只有在確定屬於目前
  // 選取班級時才可覆蓋清單的角色，避免快速切班時瞬間露出前一班的教師操作。
  const role = bulletinViewer?.classId === selectedClassId
    ? bulletinViewer.role
    : selectedClass?.role ?? null;
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const unreadCount = isStudent
    ? announcements.filter((item) => item.requiresRead && !item.hasRead).length
    : 0;
  const visibleAnnouncements = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return announcements
      .filter((item) => filter !== "unread" || (item.requiresRead && !item.hasRead))
      .filter((item) => !keyword || `${item.title} ${item.content} ${item.authorName}`.toLowerCase().includes(keyword));
  }, [announcements, filter, query]);

  async function selectFilter(nextFilter: Filter) {
    if (nextFilter === "archived") {
      if (!isTeacher) return;
      if (selectedClassId !== null && await fetchAnnouncements(selectedClassId, "archived")) setFilter(nextFilter);
      return;
    }
    if (filter !== "archived" || (selectedClassId !== null && await fetchAnnouncements(selectedClassId, "active"))) setFilter(nextFilter);
  }

  function reloadClassData() {
    if (selectedClassId === null) {
      void fetchClasses();
      return;
    }
    void fetchAnnouncements(selectedClassId, filter === "archived" ? "archived" : "active");
    void fetchEvents(selectedClassId);
    void fetchResources(selectedClassId);
  }

  async function markRead(id: number) {
    setPendingAction(id);
    setError(null);
    try {
      const response = await fetch(`/api/announcements/${id}/read`, { method: "POST" });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法確認已讀，請稍後再試。"));
      setAnnouncements((items) => items.map((item) => item.id === id ? { ...item, hasRead: true } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法確認已讀，請稍後再試。");
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleArchive(id: number) {
    const classId = selectedClassId;
    if (classId === null) return;
    const archived = filter !== "archived";
    setPendingAction(id);
    setError(null);
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法更新封存狀態，請稍後再試。"));
      await fetchAnnouncements(classId, filter === "archived" ? "archived" : "active");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法更新封存狀態，請稍後再試。");
    } finally {
      setPendingAction(null);
    }
  }

  async function updateAnnouncement(event: FormEvent<HTMLFormElement>, announcementId: number) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    setSavingAnnouncementEdit(true);
    setError(null);
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("editTitle") ?? ""),
          content: String(form.get("editContent") ?? ""),
          category: String(form.get("editCategory") ?? ""),
          isPinned: form.get("editPinned") === "on",
          requiresRead: form.get("editRequiresRead") === "on",
          expiresAt: String(form.get("editExpiresAt") ?? "") || null,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法更新公告，請稍後再試。"));
      setEditingAnnouncementId(null);
      await fetchAnnouncements(classId, filter === "archived" ? "archived" : "active");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法更新公告，請稍後再試。");
    } finally {
      setSavingAnnouncementEdit(false);
    }
  }

  async function uploadAttachments(announcementId: number, files: File[]) {
    if (!files.length) return;
    setUploadingAnnouncementId(announcementId);
    setError(null);
    let failed = false;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(`/api/announcements/${announcementId}/attachments`, {
          method: "POST",
          body: form,
        });
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          failed = true;
          throw new Error(messageFromResponse(body, `「${file.name}」上傳失敗，請稍後再試。`));
        }
      }
      if (selectedClassId !== null) await fetchAnnouncements(selectedClassId, filter === "archived" ? "archived" : "active");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "附件上傳失敗，請稍後再試。");
    } finally {
      setUploadingAnnouncementId(null);
      if (failed && selectedClassId !== null) void fetchAnnouncements(selectedClassId, filter === "archived" ? "archived" : "active");
    }
  }

  async function deleteAttachment(attachment: Attachment) {
    const classId = selectedClassId;
    if (classId === null || !window.confirm(`確定要刪除附件「${attachment.originalName}」嗎？此操作無法復原。`)) return;
    setDeletingAttachmentId(attachment.id);
    setError(null);
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, { method: "DELETE" });
      const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法刪除附件，請稍後再試。"));
      await fetchAnnouncements(classId, filter === "archived" ? "archived" : "active");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法刪除附件，請稍後再試。");
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    setSavingEvent(true);
    setError(null);
    try {
      const response = await fetch(`/api/classes/${classId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("eventTitle") ?? ""),
          location: String(form.get("eventLocation") ?? ""),
          startsAt: String(form.get("eventStartsAt") ?? ""),
          endsAt: String(form.get("eventEndsAt") ?? "") || null,
          description: String(form.get("eventDescription") ?? ""),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法新增行事，請稍後再試。"));
      event.currentTarget.reset();
      setEventComposerOpen(false);
      await fetchEvents(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法新增行事，請稍後再試。");
    } finally {
      setSavingEvent(false);
    }
  }

  async function deleteEvent(item: ClassEvent) {
    const classId = selectedClassId;
    if (classId === null || !window.confirm(`確定要刪除行事「${item.title}」嗎？此操作無法復原。`)) return;
    setDeletingEventId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/events/${item.id}`, { method: "DELETE" });
      const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法刪除行事，請稍後再試。"));
      await fetchEvents(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法刪除行事，請稍後再試。");
    } finally {
      setDeletingEventId(null);
    }
  }

  async function updateEvent(event: FormEvent<HTMLFormElement>, eventId: number) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    setSavingEventEdit(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("editEventTitle") ?? ""),
          location: String(form.get("editEventLocation") ?? ""),
          startsAt: String(form.get("editEventStartsAt") ?? ""),
          endsAt: String(form.get("editEventEndsAt") ?? "") || null,
          description: String(form.get("editEventDescription") ?? ""),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法更新行事，請稍後再試。"));
      setEditingEventId(null);
      await fetchEvents(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法更新行事，請稍後再試。");
    } finally {
      setSavingEventEdit(false);
    }
  }

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    setSavingResource(true);
    setError(null);
    try {
      const response = await fetch(`/api/classes/${classId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("resourceTitle") ?? ""),
          url: String(form.get("resourceUrl") ?? ""),
          category: String(form.get("resourceCategory") ?? "其他"),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法新增資源，請稍後再試。"));
      event.currentTarget.reset();
      setResourceComposerOpen(false);
      await fetchResources(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法新增資源，請稍後再試。");
    } finally {
      setSavingResource(false);
    }
  }

  async function deleteResource(item: ClassResource) {
    const classId = selectedClassId;
    if (classId === null || !window.confirm(`確定要刪除資源「${item.title}」嗎？此操作無法復原。`)) return;
    setDeletingResourceId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/resources/${item.id}`, { method: "DELETE" });
      const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法刪除資源，請稍後再試。"));
      await fetchResources(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法刪除資源，請稍後再試。");
    } finally {
      setDeletingResourceId(null);
    }
  }

  async function addResourceFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("請選擇一個資源檔案。");
      return;
    }
    setSavingResourceFile(true);
    setError(null);
    try {
      const response = await fetch(`/api/classes/${classId}/resource-files`, {
        method: "POST",
        body: form,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法上傳資源檔案，請稍後再試。"));
      event.currentTarget.reset();
      setResourceFileComposerOpen(false);
      await fetchResources(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法上傳資源檔案，請稍後再試。");
    } finally {
      setSavingResourceFile(false);
    }
  }

  async function deleteResourceFile(item: ClassResourceFile) {
    const classId = selectedClassId;
    if (classId === null || !window.confirm(`確定要刪除資源檔案「${item.title}」嗎？此操作無法復原。`)) return;
    setDeletingResourceFileId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/resource-files/${item.id}`, { method: "DELETE" });
      const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法刪除資源檔案，請稍後再試。"));
      await fetchResources(classId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法刪除資源檔案，請稍後再試。");
    } finally {
      setDeletingResourceFileId(null);
    }
  }

  function chooseAttachments(announcementId: number) {
    attachmentTargetId.current = announcementId;
    attachmentInputRef.current?.click();
  }

  function onAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const announcementId = attachmentTargetId.current;
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    attachmentTargetId.current = null;
    if (announcementId !== null) void uploadAttachments(announcementId, files);
  }

  async function addAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classId = selectedClassId;
    if (classId === null) return;
    const form = new FormData(event.currentTarget);
    const attachmentFiles = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
    if (attachmentFiles.length > 5) {
      setError("每則公告最多可附加 5 個檔案。");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/classes/${classId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          content: String(form.get("content") ?? ""),
          category: String(form.get("category") ?? ""),
          isPinned: form.get("pinned") === "on",
          requiresRead: form.get("requiresRead") === "on",
          expiresAt: String(form.get("expiresAt") ?? "") || null,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFromResponse(body, "無法發布公告，請稍後再試。"));
      const data = body as CreatedAnnouncementResponse;
      event.currentTarget.reset();
      setComposerOpen(false);
      setFilter("all");
      if (attachmentFiles.length) {
        await uploadAttachments(data.announcement.id, attachmentFiles);
      } else {
        await fetchAnnouncements(classId, "active");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法發布公告，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="建功班務首頁"><span className="brand-mark">建</span><span>建功班務</span></a>
        <nav aria-label="主要功能" className="desktop-nav">
          <a className="active" href="#announcements">公告</a><a href="#calendar">行事曆</a><a href="#resources">班級資源</a>
        </nav>
        <div className="account-area">
          <span className="notice-button" aria-label={`通知，${unreadCount} 則未讀`}><span aria-hidden="true">🔔</span>{unreadCount > 0 && <i>{unreadCount}</i>}</span>
          <div className="profile-button" aria-label="目前登入身分">
            <span className="avatar">{displayName.slice(0, 1) || "…"}</span><span className="profile-name">{displayName || "讀取身分中"}</span>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow">{selectedClass?.schoolYear ?? "班級資料讀取中"}</p><h1>{selectedClass?.name ?? "班級佈告板"}</h1><p>一起把每一件重要的事，說清楚、記下來。</p></div>
        <label className="class-switch"><span className="online-dot" />目前班級：
          <select
            aria-label="選擇班級"
            disabled={classes.length === 0}
            value={selectedClassId ?? ""}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
          >
            {classes.map((item) => <option value={item.id} key={item.id}>{item.schoolYear}　{item.name}</option>)}
          </select>
        </label>
      </section>

      <section className="content-grid" id="announcements">
        <div className="main-column">
          <input ref={attachmentInputRef} className="visually-hidden" type="file" multiple accept={acceptedAttachmentTypes} onChange={onAttachmentSelection} tabIndex={-1} />
          <div className="section-heading">
            <div><p className="eyebrow">CLASSROOM FEED</p><h2>班級公告</h2></div>
            {isTeacher && <button className="primary-button" type="button" onClick={() => setComposerOpen(!composerOpen)}>＋ 發布公告</button>}
          </div>

          {composerOpen && isTeacher && <form className="composer" onSubmit={addAnnouncement}>
            <div className="composer-top"><strong>發布新公告</strong><button type="button" className="text-button" onClick={() => setComposerOpen(false)}>取消</button></div>
            <label>標題<input name="title" maxLength={120} placeholder="輸入清楚的公告標題" required /></label>
            <label>內容<textarea name="content" rows={3} maxLength={5000} placeholder="寫下同學需要知道的時間、地點與事項" required /></label>
            <div className="form-row"><label>分類<select name="category" defaultValue="班務"><option>班務</option><option>作業</option><option>活動</option><option>考試</option></select></label><label>截止時間<input name="expiresAt" type="datetime-local" /></label><label>附件（最多 5 個，每個 10 MB）<input name="attachments" type="file" multiple accept={acceptedAttachmentTypes} /></label><div className="checks"><label><input name="pinned" type="checkbox" /> 置頂</label><label><input name="requiresRead" type="checkbox" defaultChecked /> 要求已讀</label></div><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "發布中…" : "發布"}</button></div>
          </form>}

          {error && <div className="status-message" role="alert">{error}<button className="text-button" type="button" onClick={reloadClassData}>重新載入</button></div>}

          <div className="toolbar">
            <div className="filters" role="tablist" aria-label="公告篩選">
              <button className={filter === "all" ? "selected" : ""} onClick={() => void selectFilter("all")} type="button">最新公告</button>
              {isStudent && <button className={filter === "unread" ? "selected" : ""} onClick={() => void selectFilter("unread")} type="button">未讀 <span>{unreadCount}</span></button>}
              {isTeacher && <button className={filter === "archived" ? "selected" : ""} onClick={() => void selectFilter("archived")} type="button">封存</button>}
            </div>
            <label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋公告" aria-label="搜尋公告" /></label>
          </div>

          <div className="announcement-list" aria-live="polite" aria-busy={isLoading}>
            {isLoading && <div className="empty-state"><strong>正在載入公告…</strong></div>}
            {!isLoading && visibleAnnouncements.map((item) => <article className={`announcement-card ${isStudent && item.hasRead ? "is-read" : ""}`} key={item.id}>
              <div className="announcement-meta"><span className={categoryClass[item.category]}>{item.category}</span>{item.isPinned && <span className="pin">📌 置頂</span>}<span>{formatPublishedAt(item.publishedAt)}</span></div>
              {editingAnnouncementId === item.id && isTeacher ? <form className="announcement-editor" onSubmit={(event) => void updateAnnouncement(event, item.id)}><label>標題<input name="editTitle" maxLength={120} defaultValue={item.title} required /></label><label>內容<textarea name="editContent" rows={3} maxLength={5000} defaultValue={item.content} required /></label><div className="editor-row"><label>分類<select name="editCategory" defaultValue={item.category}><option>班務</option><option>作業</option><option>活動</option><option>考試</option></select></label><label>截止時間<input name="editExpiresAt" type="datetime-local" defaultValue={toDateTimeLocalValue(item.expiresAt)} /></label><div className="checks"><label><input name="editPinned" type="checkbox" defaultChecked={item.isPinned} /> 置頂</label><label><input name="editRequiresRead" type="checkbox" defaultChecked={item.requiresRead} /> 要求已讀</label></div></div><div className="editor-actions"><button className="primary-button" type="submit" disabled={savingAnnouncementEdit}>{savingAnnouncementEdit ? "儲存中…" : "儲存變更"}</button><button className="text-button" type="button" disabled={savingAnnouncementEdit} onClick={() => setEditingAnnouncementId(null)}>取消</button></div></form> : <><h3>{item.title}</h3><p>{item.content}</p></>}
              {item.attachments.map((attachment) => <div className="attachment-row" key={attachment.id}><a className="attachment" href={`/api/attachments/${attachment.id}/download`} download>▣ <span>{attachment.originalName}</span><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small><em>下載</em></a>{isTeacher && <button className="text-button attachment-delete" type="button" disabled={deletingAttachmentId === attachment.id} onClick={() => void deleteAttachment(attachment)}>{deletingAttachmentId === attachment.id ? "刪除中…" : "刪除"}</button>}</div>)}
              <footer><span className="author"><b>{item.authorName.slice(0, 1)}</b>{item.authorName}</span><div className="card-actions">
                {isTeacher && <><span className="read-summary">已讀 {item.readReceiptCount ?? 0} 位</span><button className="text-button" type="button" disabled={editingAnnouncementId !== null} onClick={() => setEditingAnnouncementId(item.id)}>編輯</button><button className="text-button" type="button" disabled={uploadingAnnouncementId === item.id || editingAnnouncementId !== null} onClick={() => chooseAttachments(item.id)}>{uploadingAnnouncementId === item.id ? "上傳中…" : "新增附件"}</button><button className="text-button" type="button" disabled={pendingAction === item.id || editingAnnouncementId !== null} onClick={() => void toggleArchive(item.id)}>{pendingAction === item.id ? "處理中…" : filter === "archived" ? "還原" : "封存"}</button></>}
                {isStudent && item.requiresRead && (item.hasRead ? <span className="read-status">✓ 已確認閱讀</span> : <button type="button" className="read-button" disabled={pendingAction === item.id} onClick={() => void markRead(item.id)}>{pendingAction === item.id ? "處理中…" : "✓ 確認已讀"}</button>)}
              </div></footer>
            </article>)}
            {!isLoading && !visibleAnnouncements.length && <div className="empty-state"><strong>{error ? "目前無法顯示公告" : "找不到符合的公告"}</strong><p>{error ? "請確認已登入且已加入此班級，再重新載入。" : "試著調整搜尋關鍵字或篩選條件。"}</p></div>}
          </div>
        </div>

        <aside className="sidebar">
          {isStudent && <section className="summary-card"><div className="summary-icon">◎</div><div><strong>{unreadCount} 則未讀公告</strong><p>先完成需要確認的事項。</p></div><button type="button" onClick={() => void selectFilter("unread")}>查看</button></section>}
          <section className="side-card" id="calendar"><div className="side-title"><div><p className="eyebrow">COMING UP</p><h2>班級行事</h2></div>{isTeacher && <button className="text-button" type="button" onClick={() => setEventComposerOpen(!eventComposerOpen)}>{eventComposerOpen ? "取消" : "新增行事"}</button>}</div>
            {eventComposerOpen && isTeacher && <form className="event-composer" onSubmit={addEvent}><label>標題<input name="eventTitle" maxLength={120} required /></label><label>開始時間<input name="eventStartsAt" type="datetime-local" required /></label><label>結束時間（選填）<input name="eventEndsAt" type="datetime-local" /></label><label>地點（選填）<input name="eventLocation" maxLength={160} /></label><label>說明（選填）<textarea name="eventDescription" rows={2} maxLength={1000} /></label><button className="primary-button" type="submit" disabled={savingEvent}>{savingEvent ? "儲存中…" : "儲存行事"}</button></form>}
            <ol className="events" aria-live="polite" aria-busy={eventsLoading}>
              {eventsLoading && <li className="event-empty">正在載入行事…</li>}
              {!eventsLoading && events.map((item) => {
                const date = formatEventDate(item.startsAt);
                const isEditing = editingEventId === item.id;
                return <li key={item.id} className={isEditing ? "event-is-editing" : ""}>
                  <time><b>{date.day}</b><span>{date.month}</span></time>
                  {isEditing && isTeacher ? <form className="event-editor" onSubmit={(event) => void updateEvent(event, item.id)}>
                    <label>標題<input name="editEventTitle" maxLength={120} defaultValue={item.title} required /></label>
                    <label>開始時間<input name="editEventStartsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(item.startsAt)} required /></label>
                    <label>結束時間（選填）<input name="editEventEndsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(item.endsAt)} /></label>
                    <label>地點（選填）<input name="editEventLocation" maxLength={160} defaultValue={item.location} /></label>
                    <label>說明（選填）<textarea name="editEventDescription" rows={2} maxLength={1000} defaultValue={item.description} /></label>
                    <div className="editor-actions"><button className="primary-button" type="submit" disabled={savingEventEdit}>{savingEventEdit ? "儲存中…" : "儲存變更"}</button><button className="text-button" type="button" disabled={savingEventEdit} onClick={() => setEditingEventId(null)}>取消</button></div>
                  </form> : <><div className="event-content"><strong>{item.title}</strong><p>{formatEventDetails(item)}</p>{item.description && <small>{item.description}</small>}</div>{isTeacher && <div className="event-actions"><button className="text-button" type="button" disabled={editingEventId !== null} onClick={() => setEditingEventId(item.id)}>編輯</button><button className="text-button event-delete" type="button" disabled={deletingEventId === item.id || editingEventId !== null} onClick={() => void deleteEvent(item)}>{deletingEventId === item.id ? "刪除中…" : "刪除"}</button></div></>}
                </li>;
              })}
              {!eventsLoading && !events.length && <li className="event-empty">近期沒有班級行事。</li>}
            </ol>
          </section>
          <section className="side-card" id="resources"><div className="side-title"><div><p className="eyebrow">CLASS RESOURCES</p><h2>班級資源</h2></div>{isTeacher && <div className="resource-actions"><button className="text-button" type="button" onClick={() => setResourceComposerOpen(!resourceComposerOpen)}>{resourceComposerOpen ? "取消連結" : "新增連結"}</button><button className="text-button" type="button" onClick={() => setResourceFileComposerOpen(!resourceFileComposerOpen)}>{resourceFileComposerOpen ? "取消檔案" : "上傳檔案"}</button></div>}</div>
            {resourceComposerOpen && isTeacher && <form className="resource-composer" onSubmit={addResource}><label>標題<input name="resourceTitle" maxLength={120} placeholder="例如：課表與輪值表" required /></label><label>HTTPS 網址<input name="resourceUrl" type="url" inputMode="url" placeholder="https://…" required /></label><label>分類<select name="resourceCategory" defaultValue="課程"><option>課程</option><option>表單</option><option>相簿</option><option>其他</option></select></label><p>資源連結僅接受 HTTPS 網址。</p><button className="primary-button" type="submit" disabled={savingResource}>{savingResource ? "儲存中…" : "儲存資源"}</button></form>}
            {resourceFileComposerOpen && isTeacher && <form className="resource-composer" onSubmit={addResourceFile}><label>檔案標題<input name="title" maxLength={120} placeholder="例如：第一章預習講義" required /></label><label>資源檔案（最多 10 MB）<input name="file" type="file" accept={acceptedAttachmentTypes} required /></label><label>分類<select name="category" defaultValue="課程"><option>課程</option><option>表單</option><option>相簿</option><option>其他</option></select></label><p>檔案會儲存在班級私有空間，僅班級成員可下載。</p><button className="primary-button" type="submit" disabled={savingResourceFile}>{savingResourceFile ? "上傳中…" : "上傳檔案"}</button></form>}
            <div className="resource-links" aria-live="polite" aria-busy={resourcesLoading}>{resourcesLoading && <p className="resource-empty">正在載入資源…</p>}{!resourcesLoading && resources.map((item) => <div className="resource-row" key={`link-${item.id}`}><a href={item.url} target="_blank" rel="noopener noreferrer"><span className="resource-label">連結　{item.category}　{item.title}</span><span aria-hidden="true">↗</span></a>{isTeacher && <button className="text-button resource-delete" type="button" disabled={deletingResourceId === item.id} onClick={() => void deleteResource(item)}>{deletingResourceId === item.id ? "刪除中…" : "刪除"}</button>}</div>)}{!resourcesLoading && resourceFiles.map((item) => <div className="resource-row" key={`file-${item.id}`}><a href={`/api/resource-files/${item.id}/download`} download><span className="resource-label">檔案　{item.category}　{item.title}</span><small>{Math.ceil(item.sizeBytes / 1024)} KB</small><span aria-hidden="true">↓</span></a>{isTeacher && <button className="text-button resource-delete" type="button" disabled={deletingResourceFileId === item.id} onClick={() => void deleteResourceFile(item)}>{deletingResourceFileId === item.id ? "刪除中…" : "刪除"}</button>}</div>)}{!resourcesLoading && !resources.length && !resourceFiles.length && <p className="resource-empty">尚未建立班級資源。</p>}</div>
          </section>
        </aside>
      </section>
      <footer className="site-footer">建功高中{selectedClass ? `　${selectedClass.name}` : ""}　・　本機測試時請僅使用合成帳號與隔離資料庫。</footer>
    </main>
  );
}
