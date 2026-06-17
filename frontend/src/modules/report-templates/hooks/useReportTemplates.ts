import { useEffect, useState, useCallback } from "react";
import http from "../../../core/http/http";
import type {
  ReportTemplate,
  ReportTemplateMeta,
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
} from "../types/report-template";

export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplateMeta[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const load = useCallback(async (ignore = false) => {
    setLoadingList(true);
    try {
      const { data } = await http.get<ReportTemplateMeta[]>("/report-templates");
      if (!ignore) setTemplates(data);
    } finally {
      if (!ignore) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    load(ignore);
    return () => { ignore = true; };
  }, [load]);

  async function getById(id: number): Promise<ReportTemplate> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<ReportTemplate>(`/report-templates/${id}`);
      return data;
    } finally {
      setLoadingDetail(false);
    }
  }

  // Versión interna usada por el useEffect del designer (con cancel flag)
  async function getDefaultCancellable(ignore: boolean): Promise<ReportTemplate | null> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<ReportTemplate>("/report-templates/default");
      return ignore ? null : data;
    } catch {
      return null;
    } finally {
      if (!ignore) setLoadingDetail(false);
    }
  }

  // Versión pública sin parámetros — para uso desde cualquier componente
  async function getDefault(): Promise<ReportTemplate | null> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<ReportTemplate>("/report-templates/default");
      return data;
    } catch {
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }

  async function getDefaultByType(documentType: 'sale' | 'quotation'): Promise<ReportTemplate | null> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<ReportTemplate>('/report-templates/default-by-type', {
        params: { type: documentType },
      });
      return data;
    } catch {
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }

  async function create(payload: CreateReportTemplateInput): Promise<ReportTemplate> {
    setSaving(true);
    try {
      const { data } = await http.post<ReportTemplate>("/report-templates", payload);
      await load();
      return data;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: number, payload: UpdateReportTemplateInput): Promise<ReportTemplate> {
    setSaving(true);
    try {
      const { data } = await http.put<ReportTemplate>(`/report-templates/${id}`, payload);
      await load();
      return data;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number): Promise<void> {
    setDeleting(true);
    try {
      await http.delete(`/report-templates/${id}`);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  async function duplicate(id: number, name: string): Promise<ReportTemplate> {
    setDuplicating(true);
    try {
      const { data } = await http.post<ReportTemplate>(
        `/report-templates/${id}/duplicate`,
        { newName: name }
      );
      await load();
      return data;
    } finally {
      setDuplicating(false);
    }
  }

  return {
    templates,
    loadingList,
    loadingDetail,
    saving,
    deleting,
    duplicating,
    reload: load,
    getById,
    getDefault,
    getDefaultCancellable,
    create,
    update,
    remove,
    duplicate,
    getDefaultByType,
  };
}