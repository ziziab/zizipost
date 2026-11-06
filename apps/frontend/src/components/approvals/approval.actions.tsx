'use client';

import { FC, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const ApprovalActions: FC<{
  token: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'EXPIRED';
  decidedBy?: string | null;
  expiresAt: string;
}> = (props) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [status, setStatus] = useState(props.status);
  const [decidedBy, setDecidedBy] = useState(props.decidedBy || '');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [askChanges, setAskChanges] = useState(false);
  const [sending, setSending] = useState(false);

  const send = useCallback(
    (decision: 'approve' | 'changes') => async () => {
      if (!name.trim() || sending) {
        return;
      }
      if (decision === 'changes' && !note.trim()) {
        return;
      }
      setSending(true);
      const response = await fetch(
        `/public/approvals/${encodeURIComponent(props.token)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            name: name.trim(),
            ...(decision === 'changes' ? { note: note.trim() } : {}),
          }),
        }
      );
      setSending(false);
      if (!response.ok) {
        const { message } = await response.json().catch(() => ({} as any));
        toaster.show(
          (Array.isArray(message) ? message[0] : message) ||
            t('approval_failed', 'Something went wrong, please try again.'),
          'warning'
        );
        return;
      }
      const { status: newStatus } = await response.json();
      setDecidedBy(name.trim());
      setStatus(newStatus);
    },
    [name, note, sending, props.token]
  );

  if (status !== 'PENDING') {
    const text =
      status === 'APPROVED'
        ? t('approval_done_approved', 'Approved by') +
          ' ' +
          decidedBy +
          '. ' +
          t('approval_done_approved_2', 'The post is scheduled. Thank you!')
        : status === 'CHANGES_REQUESTED'
        ? t('approval_done_changes', 'Changes asked by') +
          ' ' +
          decidedBy +
          '. ' +
          t(
            'approval_done_changes_2',
            'The team will update the post and send it again.'
          )
        : t(
            'approval_expired',
            'This link has expired. Ask the team for a new one.'
          );
    return (
      <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] text-[15px] text-center">
        {text}
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[14px]">
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="approval-name" className="text-[14px]">
          {t('approval_your_name', 'Your name')}
        </label>
        <input
          id="approval-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
          className="bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor px-[16px] text-[14px] outline-none max-w-[360px]"
        />
      </div>
      {askChanges && (
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="approval-note" className="text-[14px]">
            {t('approval_what_to_change', 'What should change?')}
          </label>
          <textarea
            id="approval-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={4}
            className="bg-newBgColorInner border-newTableBorder border rounded-[8px] text-textColor p-[12px] text-[14px] outline-none"
          />
        </div>
      )}
      <div className="flex gap-[10px] flex-wrap">
        {askChanges ? (
          <>
            <Button
              onClick={send('changes')}
              disabled={!name.trim() || !note.trim()}
              loading={sending}
            >
              {t('approval_send_changes', 'Send my changes')}
            </Button>
            <Button secondary={true} onClick={() => setAskChanges(false)}>
              {t('cancel', 'Cancel')}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={send('approve')}
              disabled={!name.trim()}
              loading={sending}
            >
              {t('approval_approve', 'Approve')}
            </Button>
            <Button secondary={true} onClick={() => setAskChanges(true)}>
              {t('approval_ask_changes', 'Ask for changes')}
            </Button>
          </>
        )}
      </div>
      <div className="text-[12px] text-textItemBlur">
        {t('approval_link_valid', 'This link works until')}{' '}
        {dayjs(props.expiresAt).format('D MMM YYYY')}.{' '}
        {t(
          'approval_past_time_note',
          'If the post time has already passed, approving posts it right away.'
        )}
      </div>
    </div>
  );
};
