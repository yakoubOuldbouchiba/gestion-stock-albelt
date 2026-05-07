import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { useI18n } from '@hooks/useI18n';
import type { ChangePasswordRequest } from '../../types/index';

interface Props {
  visible: boolean;
  username: string;
  adminMode?: boolean;   // true = no current-password field
  onHide: () => void;
  onSave: (data: ChangePasswordRequest) => Promise<void>;
  isSaving: boolean;
}

export function PasswordResetModal({ visible, username, adminMode = true, onHide, onSave, isSaving }: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!adminMode && !form.currentPassword) errs.currentPassword = t('admin.passwordReset.errCurrentRequired');
    if (form.newPassword.length < 8)         errs.newPassword     = t('admin.passwordReset.errPasswordMin');
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = t('admin.passwordReset.errPasswordsMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload: ChangePasswordRequest = {
      currentPassword:  adminMode ? undefined : form.currentPassword,
      newPassword:      form.newPassword,
      confirmPassword:  form.confirmPassword,
    };
    await onSave(payload);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label={t('admin.passwordReset.btnCancel')} icon="pi pi-times" text onClick={onHide} disabled={isSaving} />
      <Button label={t('admin.passwordReset.btnReset')} icon="pi pi-lock" onClick={handleSave} loading={isSaving} severity="warning" />
    </div>
  );

  return (
    <Dialog
      header={t('admin.passwordReset.title', { username })}
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: '400px' }}
      closable={!isSaving}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
        {!adminMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label>{t('admin.passwordReset.labelCurrent')} <span style={{ color: 'red' }}>*</span></label>
            <Password
              value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
              className={errors.currentPassword ? 'p-invalid' : ''}
              feedback={false}
              toggleMask
              style={{ width: '100%' }}
            />
            {errors.currentPassword && <small className="p-error">{errors.currentPassword}</small>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label>{t('admin.passwordReset.labelNew')} <span style={{ color: 'red' }}>*</span></label>
          <Password
            value={form.newPassword}
            onChange={e => set('newPassword', e.target.value)}
            className={errors.newPassword ? 'p-invalid' : ''}
            feedback
            toggleMask
            style={{ width: '100%' }}
          />
          {errors.newPassword && <small className="p-error">{errors.newPassword}</small>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label>{t('admin.passwordReset.labelConfirm')} <span style={{ color: 'red' }}>*</span></label>
          <Password
            value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'p-invalid' : ''}
            feedback={false}
            toggleMask
            style={{ width: '100%' }}
          />
          {errors.confirmPassword && <small className="p-error">{errors.confirmPassword}</small>}
        </div>
      </div>
    </Dialog>
  );
}
