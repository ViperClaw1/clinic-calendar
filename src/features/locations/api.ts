import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/api/client';

export interface LocationInput {
  id?: string;
  name: string;
  address: string;
  timezone: string;
  createdBy: string;
}

const locationError = (error: unknown) => {
  const code = (error as { code?: string }).code;
  if (code === '42501') toast.error('You do not have permission to do this.');
  else if (code === '23503') toast.error('This location still has appointments, so it cannot be deleted.');
  else if (code === '23514') toast.error('That time zone is not supported.');
  else if (code === 'PGRST204') toast.error('Location saving is not available until the latest database migration is applied.');
  else toast.error('Could not save. Please try again.');
};

const refresh = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['locations'] });
  queryClient.invalidateQueries({ queryKey: ['physicians'] });
};

export const useSaveLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LocationInput) => {
      const row = { name: input.name, address: input.address, timezone: input.timezone };
      const { error } = input.id
        ? await supabase.from('locations').update(row).eq('id', input.id)
        : await supabase.from('locations').insert({ ...row, created_by: input.createdBy });
      if (error) throw error;
    },
    onSuccess: (_data, input) => toast.success(input.id ? 'Location updated' : 'Location added'),
    onError: locationError,
    onSettled: () => refresh(queryClient),
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Location deleted'),
    onError: locationError,
    onSettled: () => refresh(queryClient),
  });
};
