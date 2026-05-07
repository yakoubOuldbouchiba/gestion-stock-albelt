import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useI18n } from '@hooks/useI18n';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../types/index';

interface Props {
  visible: boolean;
  user: User | null;          // null = create mode
  onHide: () => void;
  onSave: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  isSaving: boolean;
}

const empty = { username: '', email: '', password: '', fullName: '', role: 'OPERATOR' as UserRole, isActive: true };

export function UserFormModal({ visible, user, onHide, onSave, isSaving }: Props) {
  const isEdit    = user !== null;
  const { t }     = useI18n();
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: t('admin.users.roleOptions.superAdmin'), value: 'SUPER_ADMIN' },
    { label: t('admin.users.roleOptions.admin'),      value: 'ADMIN' },
    { label: t('admin.users.roleOptions.operator'),   value: 'OPERATOR' },
    { label: t('admin.users.roleOptions.readonly'),   value: 'READONLY' },
  ];

  useEffect(() => {
    if (visible) {
      if (user) {
        setForm({
          username: user.username,
          email:    user.email,
          password: '',
          fullName: user.fullName ?? '',
          role:     user.role,
          isActive: user.isActive,
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [visible, user]);

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isEdit && !form.username.trim())    errs.username = t('admin.userForm.errUsernameRequired');
    if (!form.email.trim())                  errs.email    = t('admin.userForm.errEmailRequired');
    if (!/\S+@\S+\.\S+/.test(form.email))   errs.email    = t('admin.userForm.errEmailInvalid');
    if (!isEdit && form.password.length < 8) errs.password = t('admin.userForm.errPasswordMin');
    if (!form.role)                          errs.role     = t('admin.userForm.errRoleRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (isEdit) {
      const payload: UpdateUserRequest = {
        email:    form.email,
        fullName: form.fullName || undefined,
        role:     form.role,
        isActive: form.isActive,
      };
      await onSave(payload);
    } else {
      const payload: CreateUserRequest = {
        username: form.username,
        email:    form.email,
        password: form.password,
        fullName: form.fullName || undefined,
        role:     form.role,
        isActive: form.isActive,
      };
      await onSave(payload);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label={t('admin.userForm.btnCancel')} icon="pi pi-times" text onClick={onHide} disabled={isSaving} />
      <Button label={isEdit ? t('admin.userForm.btnUpdate') : t('admin.userForm.btnCreate')} icon="pi pi-check" onClick={handleSave} loading={isSaving} />
    </div>
  );

  return (
    <Dialog
      header={isEdit ? t('admin.userForm.titleEdit', { username: user?.username }) : t('admin.userForm.titleCreate')}
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: '540px' }}
      closable={!isSaving}
    >
      <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem', paddingTop: '0.5rem' }}>

        {/* Username — create only */}
        {!isEdit && (
          <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="uf-username">{t('admin.userForm.labelUsername')} <span style={{ color: 'red' }}>*</span></label>
            <InputText
              id="uf-username"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              className={errors.username ? 'p-invalid' : ''}
              autoFocus
            />
            {errors.username && <small className="p-error">{errors.username}</small>}
          </div>
        )}

        {/* Email */}
        <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label htmlFor="uf-email">{t('admin.userForm.labelEmail')} <span style={{ color: 'red' }}>*</span></label>
          <InputText
            id="uf-email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className={errors.email ? 'p-invalid' : ''}
          />
          {errors.email && <small className="p-error">{errors.email}</small>}
        </div>

        {/* Full name */}
        <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label htmlFor="uf-fullname">{t('admin.userForm.labelFullName')}</label>
          <InputText
            id="uf-fullname"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
          />
        </div>

        {/* Password — create only */}
        {!isEdit && (
          <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="uf-password">{t('admin.userForm.labelPassword')} <span style={{ color: 'red' }}>*</span></label>
            <Password
              id="uf-password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className={errors.password ? 'p-invalid' : ''}
              feedback
              toggleMask
              style={{ width: '100%' }}
            />
            {errors.password && <small className="p-error">{errors.password}</small>}
          </div>
        )}

        {/* Role */}
        <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label htmlFor="uf-role">{t('admin.userForm.labelRole')} <span style={{ color: 'red' }}>*</span></label>
          <Dropdown
            id="uf-role"
            value={form.role}
            options={ROLE_OPTIONS}
            onChange={e => set('role', e.value)}
            className={errors.role ? 'p-invalid' : ''}
            style={{ width: '100%' }}
          />
          {errors.role && <small className="p-error">{errors.role}</small>}
        </div>

        {/* Status */}
        <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label>{t('admin.userForm.labelStatus')}</label>
          <div className="flex gap-3 align-items-center" style={{ paddingTop: '0.5rem' }}>
            <label className="flex align-items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={form.isActive === true}
                onChange={() => set('isActive', true)}
              />
              {t('admin.userForm.radioActive')}
            </label>
            <label className="flex align-items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={form.isActive === false}
                onChange={() => set('isActive', false)}
              />
              {t('admin.userForm.radioInactive')}
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
