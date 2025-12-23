import { useQuery, useQueryClient } from "react-query";
import { fetch } from "service/http";
import { z } from "zod";

export const TemplatesQueryKey = "xray-config-templates";

export const XrayTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  config: z.record(z.any()),
  created_at: z.string().optional(),
  nodes_count: z.number().optional(),
});

export type XrayTemplate = z.infer<typeof XrayTemplateSchema>;

export const useTemplatesQuery = () => {
  return useQuery<XrayTemplate[]>({
    queryKey: TemplatesQueryKey,
    queryFn: () => fetch("/xray/templates"),
    refetchOnWindowFocus: false,
  });
};

export const useTemplateActions = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries(TemplatesQueryKey);

  const createTemplate = (body: { name: string; config: object }) =>
    fetch("/xray/templates", { method: "POST", body }).then((res) => {
      invalidate();
      return res;
    });

  const updateTemplate = (id: number, body: { name?: string; config?: object }) =>
    fetch(`/xray/templates/${id}`, { method: "PUT", body }).then((res) => {
      invalidate();
      return res;
    });

  const deleteTemplate = (id: number) =>
    fetch(`/xray/templates/${id}`, { method: "DELETE" }).then((res) => {
      invalidate();
      return res;
    });

  return { createTemplate, updateTemplate, deleteTemplate };
};
