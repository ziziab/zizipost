'use client';

import { FC, useCallback, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import copy from 'copy-to-clipboard';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface Approval {
  token: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  expiresAt: string;
  decidedBy?: string | null;
  note?: string | null;
}

const useApproval = (group: string) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    const response = await fetch(`/posts/group/${group}/approval`);
    if (!response.ok) {
      return null;
    }
    return (await response.json().catch(() => null)) as Approval | null;
  }, [group]);
  return useSWR(`post-approval-${group}`, load);
};

export const ApprovalLinkModal: FC<{ group: string }> = ({ group }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data: approval, mutate, isLoading } = useApproval(group);
  const [creating, setCreating] = useState(false);

  const linkOf = useCallback(
    (token: string) => `${window.location.origin}/approve/${token}`,
    []
  );

  const createLink = useCallback(async () => {
    setCreating(true);
    const response = await fetch(`/posts/group/${group}/approval`, {
      method: 'POST',
    });
    setCreating(false);
    if (!response.ok) {
      const { message } = await response.json().catch(() => ({} as any));
      toaster.show(
        (Array.isArray(message) ? message[0] : message) ||
          t('approval_link_failed', 'Could not create the link.'),
        'warning'
      );
      return;
    }
    const created: Approval = await response.json();
    copy(linkOf(created.token));
    toaster.show(
      t(
        'approval_link_copied',
        'Approval link copied. Send it to your client.'
      ),
      'success'
    );
    mutate();
  }, [group, mutate, linkOf, toaster, t]);

  const open =
    approval?.status === 'PENDING' &&
    dayjs(approval.expiresAt).isAfter(dayjs());

  return (
    <div className="flex flex-col gap-[16px] text-[14px]">
      <div className="text-textItemBlur">
        {t(
          'approval_modal_help',
          'Your client opens this link without an account, sees the post for every channel, and approves it or asks for changes. When they approve, the draft is scheduled. The link works for 7 days.'
        )}
      </div>

      {!isLoading && !!approval && (
        <div className="border border-newTableBorder rounded-[8px] p-[12px] flex flex-col gap-[6px]">
          {approval.status === 'APPROVED' && (
            <div>
              {t('approval_state_approved', 'Approved by')}{' '}
              <b>{approval.decidedBy}</b>
            </div>
          )}
          {approval.status === 'CHANGES_REQUESTED' && (
            <>
              <div>
                {t('approval_state_changes', 'Changes asked by')}{' '}
                <b>{approval.decidedBy}</b>
              </div>
              <div className="text-textItemBlur whitespace-pre-wrap">
                {approval.note}
              </div>
            </>
          )}
          {approval.status === 'PENDING' &&
            (open ? (
              <>
                <div>
                  {t('approval_state_waiting', 'Waiting for the client.')}{' '}
                  {t('approval_link_valid', 'This link works until')}{' '}
                  {dayjs(approval.expiresAt).format('D MMM YYYY')}.
                </div>
                <div className="flex gap-[8px] items-center">
                  <input
                    readOnly
                    value={linkOf(approval.token)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-newBgColorInner h-[38px] border-newTableBorder border rounded-[8px] text-textColor px-[12px] text-[13px] outline-none"
                  />
                  <Button
                    secondary={true}
                    onClick={() => {
                      copy(linkOf(approval.token));
                      toaster.show(
                        t(
                          'link_copied_to_clipboard',
                          'Link copied to clipboard'
                        ),
                        'success'
                      );
                    }}
                  >
                    {t('copy', 'Copy')}
                  </Button>
                </div>
              </>
            ) : (
              <div>
                {t('approval_state_expired', 'The last link has expired.')}
              </div>
            ))}
        </div>
      )}

      <div>
        <Button onClick={createLink} loading={creating}>
          {approval
            ? t('approval_new_link', 'Create a new link')
            : t('approval_create_link', 'Create approval link')}
        </Button>
      </div>
    </div>
  );
};
