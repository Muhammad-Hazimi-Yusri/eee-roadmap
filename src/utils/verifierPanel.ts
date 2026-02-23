// src/utils/verifierPanel.ts
// Injects the verifier panel into .node-content elements for users with
// verifier or admin roles. Called from roadmapInteractions.ts after role check.

import {
  verifyAspect,
  revokeVerification,
  fetchTrackVerifications,
  buildTopicStatus,
} from './verification';
import { VERIFICATION_ASPECTS, type VerificationAspect, type VerificationRow } from '../types/verification';

interface PanelOptions {
  trackSlug: string;
  isAdmin: boolean;
  verifierName: string;
  rows: VerificationRow[];
}

function showToast(message: string, type: 'success' | 'error'): void {
  document.getElementById('verification-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'verification-toast';
  toast.className = `verification-toast verification-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('verification-toast--visible');
    setTimeout(() => {
      toast.classList.remove('verification-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  });
}

function buildPanel(
  topicKey: string,
  rows: VerificationRow[],
  isAdmin: boolean
): HTMLDivElement {
  const status = buildTopicStatus(topicKey, rows);

  const panel = document.createElement('div');
  panel.className = 'verifier-panel';
  panel.setAttribute('data-topic-key', topicKey);

  const header = document.createElement('div');
  header.className = 'verifier-panel__header';
  const label = document.createElement('span');
  label.className = 'verifier-panel__label';
  label.textContent = 'Verification';
  header.appendChild(label);
  panel.appendChild(header);

  const aspects = document.createElement('div');
  aspects.className = 'verifier-panel__aspects';

  for (const aspect of VERIFICATION_ASPECTS) {
    const isVerified = status.verified_aspects.includes(aspect);
    const verificationRow = status.verifications.find(v => v.aspect === aspect);

    const row = document.createElement('div');
    row.className = 'verifier-panel__aspect-row';

    const checkboxId = `verify-${topicKey.replace('/', '-')}-${aspect}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'verifier-panel__checkbox';
    checkbox.id = checkboxId;
    checkbox.checked = isVerified;
    checkbox.disabled = isVerified && !isAdmin;
    checkbox.setAttribute('data-aspect', aspect);

    const lbl = document.createElement('label');
    lbl.htmlFor = checkboxId;
    lbl.className = 'verifier-panel__aspect-label';
    lbl.textContent = aspect.charAt(0).toUpperCase() + aspect.slice(1);

    row.appendChild(checkbox);
    row.appendChild(lbl);

    if (isVerified && verificationRow) {
      const meta = document.createElement('span');
      meta.className = 'verifier-panel__aspect-meta';
      const date = new Date(verificationRow.verified_at).toLocaleDateString();
      meta.textContent = `${verificationRow.verifier_name ?? 'Verifier'} · ${date}`;
      row.appendChild(meta);

      if (isAdmin) {
        const revokeBtn = document.createElement('button');
        revokeBtn.className = 'verifier-panel__revoke-btn';
        revokeBtn.textContent = '✕';
        revokeBtn.title = `Revoke ${aspect} verification`;
        revokeBtn.setAttribute('data-verification-id', verificationRow.id);
        revokeBtn.setAttribute('data-aspect', aspect);
        row.appendChild(revokeBtn);
      }
    }

    aspects.appendChild(row);
  }

  panel.appendChild(aspects);
  return panel;
}

function wirePanel(
  panel: HTMLDivElement,
  topicKey: string,
  verifierName: string,
  isAdmin: boolean,
  onMutation: () => Promise<void>
): void {
  panel.querySelectorAll<HTMLInputElement>('.verifier-panel__checkbox:not(:disabled)').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const aspect = checkbox.getAttribute('data-aspect') as VerificationAspect;
      if (!aspect) return;

      const confirmed = window.confirm(
        `Verify "${aspect}" for this topic?\n\nThis records your name and today's date.`
      );
      if (!confirmed) {
        checkbox.checked = false;
        return;
      }

      checkbox.disabled = true;
      checkbox.classList.add('verifier-panel__checkbox--loading');

      const result = await verifyAspect(topicKey, aspect, verifierName);

      if (result) {
        showToast(`Verified: ${aspect}`, 'success');
        await onMutation();
      } else {
        checkbox.checked = false;
        checkbox.disabled = false;
        checkbox.classList.remove('verifier-panel__checkbox--loading');
        showToast(`Failed to verify ${aspect}. It may already be verified.`, 'error');
      }
    });
  });

  if (isAdmin) {
    panel.querySelectorAll<HTMLButtonElement>('.verifier-panel__revoke-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const verificationId = btn.getAttribute('data-verification-id');
        const aspect = btn.getAttribute('data-aspect');
        if (!verificationId) return;

        const confirmed = window.confirm(
          `Revoke the "${aspect}" verification?\n\nThis cannot be undone without re-verifying.`
        );
        if (!confirmed) return;

        btn.disabled = true;
        const success = await revokeVerification(verificationId);

        if (success) {
          showToast(`Revoked: ${aspect}`, 'success');
          await onMutation();
        } else {
          btn.disabled = false;
          showToast('Failed to revoke. Check permissions.', 'error');
        }
      });
    });
  }
}

export async function initVerifierPanels(options: PanelOptions): Promise<void> {
  const { trackSlug, isAdmin, verifierName } = options;
  let currentRows = options.rows;

  async function refetch(): Promise<void> {
    currentRows = await fetchTrackVerifications(trackSlug);
    renderAll();
  }

  function renderAll(): void {
    document.querySelectorAll<HTMLElement>('[data-node-id]').forEach(node => {
      const topicId = node.getAttribute('data-node-id');
      if (!topicId) return;

      const content = node.querySelector<HTMLElement>('.node-content');
      if (!content) return;

      content.querySelector('.verifier-panel')?.remove();

      const topicKey = `${trackSlug}/${topicId}`;
      const panel = buildPanel(topicKey, currentRows, isAdmin);
      wirePanel(panel, topicKey, verifierName, isAdmin, refetch);
      content.appendChild(panel);
    });
  }

  renderAll();
}
