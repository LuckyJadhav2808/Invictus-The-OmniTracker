import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { type Subject, type Topic, type StudySession, type Test } from "@/types";

const isGuestMode = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

// --- SUBJECTS ---

export function useSubjects() {
  const { user } = useAuth();

  return useQuery<Subject[]>({
    queryKey: ["subjects", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subjects");
        const list = local ? JSON.parse(local) : [];
        return list.filter((s: any) => !s.archived);
      }
      if (!user) return [];
      const res = await fetch(`/api/study/subjects?userId=${user.uid}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((s: any) => ({ ...s, id: s.id || s._id })).filter((s: any) => !s.archived);
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddSubject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: Omit<Subject, "id" | "archived" | "createdAt" | "updatedAt">) => {
      const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newSubject = {
        ...subject,
        id,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Subject;

      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subjects");
        const list = local ? JSON.parse(local) : [];
        list.push(newSubject);
        localStorage.setItem("invictus_subjects", JSON.stringify(list));
        return newSubject;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, ...subject }),
      });

      if (!res.ok) throw new Error("Failed to add subject to MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", user?.uid] });
    },
  });
}

export function useUpdateSubject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: Partial<Subject> & { id: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subjects");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((s: any) => s.id === subject.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...subject, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_subjects", JSON.stringify(list));
        }
        return subject;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...subject }),
      });

      if (!res.ok) throw new Error("Failed to update subject in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", user?.uid] });
    },
  });
}

export function useDeleteSubject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subjectId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subjects");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((s: any) => s.id !== subjectId);
        localStorage.setItem("invictus_subjects", JSON.stringify(filtered));

        // Delete associated topics
        const localTopics = localStorage.getItem("invictus_topics");
        if (localTopics) {
          const tList = JSON.parse(localTopics);
          const tFiltered = tList.filter((t: any) => t.subjectId !== subjectId);
          localStorage.setItem("invictus_topics", JSON.stringify(tFiltered));
        }
        return subjectId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/study/subjects?id=${subjectId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete subject from MongoDB");
      return subjectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["topics", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allTopics", user?.uid] });
    },
  });
}

// --- TOPICS ---

export function useTopics(subjectId: string) {
  const { user } = useAuth();

  return useQuery<Topic[]>({
    queryKey: ["topics", user?.uid, subjectId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_topics");
        const list = local ? JSON.parse(local) : [];
        return list.filter((t: any) => t.subjectId === subjectId);
      }
      if (!user) return [];

      const res = await fetch(`/api/study/topics?userId=${user.uid}&subjectId=${subjectId}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((t: any) => ({ ...t, id: t.id || t._id }));
    },
    enabled: (!!user || isGuestMode()) && !!subjectId,
  });
}

export function useAllTopics() {
  const { user } = useAuth();

  return useQuery<Topic[]>({
    queryKey: ["allTopics", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_topics");
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];

      const res = await fetch(`/api/study/topics?userId=${user.uid}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((t: any) => ({ ...t, id: t.id || t._id }));
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddTopic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topic: Omit<Topic, "id" | "createdAt" | "updatedAt">) => {
      const id = `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTopic = {
        ...topic,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Topic;

      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_topics");
        const list = local ? JSON.parse(local) : [];
        list.push(newTopic);
        localStorage.setItem("invictus_topics", JSON.stringify(list));
        return newTopic;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, ...topic }),
      });

      if (!res.ok) throw new Error("Failed to add topic to MongoDB");
      return res.json();
    },
    onSuccess: (_, variables: any) => {
      if (variables?.subjectId) {
        queryClient.invalidateQueries({ queryKey: ["topics", user?.uid, variables.subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["topics", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allTopics", user?.uid] });
    },
  });
}

export function useUpdateTopic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topic: Partial<Topic> & { id: string; subjectId?: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_topics");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((t: any) => t.id === topic.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...topic, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_topics", JSON.stringify(list));
        }
        return topic;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...topic }),
      });

      if (!res.ok) throw new Error("Failed to update topic in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables: any) => {
      if (variables?.subjectId) {
        queryClient.invalidateQueries({ queryKey: ["topics", user?.uid, variables.subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["topics", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allTopics", user?.uid] });
    },
  });
}

export function useDeleteTopic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { topicId: string; subjectId?: string } | string) => {
      const topicId = typeof payload === "string" ? payload : payload.topicId;
      const subjectId = typeof payload === "string" ? undefined : payload.subjectId;
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_topics");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((t: any) => t.id !== topicId);
        localStorage.setItem("invictus_topics", JSON.stringify(filtered));
        return { topicId, subjectId };
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/study/topics?id=${topicId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete topic from MongoDB");
      return { topicId, subjectId };
    },
    onSuccess: (_, variables: any) => {
      const subjectId = typeof variables === "string" ? undefined : variables?.subjectId;
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ["topics", user?.uid, subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["topics", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allTopics", user?.uid] });
    },
  });
}

// --- STUDY SESSIONS ---

export function useStudySessions(subjectId?: string) {
  const { user } = useAuth();

  return useQuery<StudySession[]>({
    queryKey: ["studySessions", user?.uid, subjectId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_study_sessions");
        const list = local ? JSON.parse(local) : [];
        if (subjectId) return list.filter((s: any) => s.subjectId === subjectId);
        return list;
      }
      if (!user) return [];

      const url = subjectId
        ? `/api/study/sessions?userId=${user.uid}&subjectId=${subjectId}`
        : `/api/study/sessions?userId=${user.uid}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((s: any) => ({ ...s, id: s.id || s._id }));
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<StudySession, "id" | "createdAt">) => {
      const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newSession = {
        ...session,
        id,
        createdAt: new Date().toISOString(),
      } as unknown as StudySession;

      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_study_sessions");
        const list = local ? JSON.parse(local) : [];
        list.unshift(newSession);
        localStorage.setItem("invictus_study_sessions", JSON.stringify(list));
        return newSession;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, ...session }),
      });

      if (!res.ok) throw new Error("Failed to add study session to MongoDB");
      return res.json();
    },
    onSuccess: (_, variables: any) => {
      if (variables?.subjectId) {
        queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid, variables.subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid] });
    },
  });
}

export function useDeleteStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, subjectId }: { sessionId: string; subjectId?: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_study_sessions");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((s: any) => s.id !== sessionId);
        localStorage.setItem("invictus_study_sessions", JSON.stringify(filtered));
        return { sessionId, subjectId };
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/study/sessions?id=${sessionId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete study session from MongoDB");
      return { sessionId, subjectId };
    },
    onSuccess: (_, variables: any) => {
      if (variables?.subjectId) {
        queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid, variables.subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["studySessions", user?.uid] });
    },
  });
}

// --- TESTS ---

export function useTests() {
  const { user } = useAuth();

  return useQuery<Test[]>({
    queryKey: ["tests", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_tests");
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];

      const res = await fetch(`/api/study/tests?userId=${user.uid}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((t: any) => ({ ...t, id: t.id || t._id }));
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddTest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (test: Omit<Test, "id" | "createdAt" | "updatedAt">) => {
      const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTest = {
        ...test,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Test;

      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_tests");
        const list = local ? JSON.parse(local) : [];
        list.unshift(newTest);
        localStorage.setItem("invictus_tests", JSON.stringify(list));
        return newTest;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, ...test }),
      });

      if (!res.ok) throw new Error("Failed to add test to MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", user?.uid] });
    },
  });
}

export function useUpdateTest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (test: Partial<Test> & { id: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_tests");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((t: any) => t.id === test.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...test, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_tests", JSON.stringify(list));
        }
        return test;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/study/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...test }),
      });

      if (!res.ok) throw new Error("Failed to update test in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", user?.uid] });
    },
  });
}

export function useDeleteTest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_tests");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((t: any) => t.id !== testId);
        localStorage.setItem("invictus_tests", JSON.stringify(filtered));
        return testId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/study/tests?id=${testId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete test from MongoDB");
      return testId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", user?.uid] });
    },
  });
}
