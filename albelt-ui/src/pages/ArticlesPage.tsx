import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { PageHeader } from '../components/PageHeader';
import { ArticleService } from '../services/articleService';
import { ColorService } from '../services/colorService';
import type { Article, ArticleRequest, MaterialType, Color } from '../types';
import { formatDate } from '../utils/date';
import { Tag } from 'primereact/tag';
import './InventoryPage.css';

interface ArticleFormData {
  materialType: MaterialType;
  thicknessMm: number;
  nbPlis: number;
  reference: string;
  name: string;
  code: string;
  externalId: string;
  colorId: string;
}

const defaultForm: ArticleFormData = {
  materialType: 'PU',
  thicknessMm: 2.5,
  nbPlis: 1,
  reference: '',
  name: '',
  code: '',
  externalId: '',
  colorId: '',
};

const materialOptions: { label: MaterialType; value: MaterialType }[] = [
  { label: 'PU', value: 'PU' },
  { label: 'PVC', value: 'PVC' },
  { label: 'CAOUTCHOUC', value: 'CAOUTCHOUC' },
];

export function ArticlesPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useI18n();
  const { run, isLocked } = useAsyncLock();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [colors, setColors] = useState<Color[]>([]);
  const [formData, setFormData] = useState<ArticleFormData>(defaultForm);

  useEffect(() => {
    loadColors();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [page, pageSize, searchTerm]);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ArticleService.getPaged({
        page,
        size: pageSize,
        search: searchTerm.trim() || undefined,
      });
      if (response.success && response.data) {
        setArticles(response.data.items ?? []);
        setTotalRecords(response.data.totalElements ?? 0);
      } else {
        setArticles([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error(err);
      setError(t('messages.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadColors = async () => {
    try {
      const response = await ColorService.getAll();
      if (response.success && response.data) {
        setColors(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Failed to load colors:', err);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (isLocked('article-save')) {
      return;
    }

    const payload: ArticleRequest = {
      materialType: formData.materialType,
      thicknessMm: formData.thicknessMm,
      nbPlis: formData.nbPlis,
      reference: formData.reference || null,
      name: formData.name || null,
      code: formData.code || null,
      externalId: formData.externalId || null,
      colorId: formData.colorId || null,
    };

    try {
      await run(async () => {
        if (editingId) {
          await ArticleService.update(editingId, payload);
        } else {
          await ArticleService.create(payload);
        }
        await loadArticles();
        handleCancel();
      }, 'article-save');
    } catch (err) {
      console.error(err);
      setError(t('messages.operationFailed'));
    }
  };

  const handleEdit = (article: Article) => {
    setFormData({
      materialType: article.materialType,
      thicknessMm: article.thicknessMm,
      nbPlis: article.nbPlis,
      reference: article.reference || '',
      name: article.name || '',
      code: article.code || '',
      externalId: article.externalId || '',
      colorId: article.colorId || '',
    });
    setEditingId(article.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    try {
      await run(async () => {
        await ArticleService.delete(id);
        await loadArticles();
      }, `article-delete-${id}`);
    } catch (err) {
      console.error(err);
      setError(t('messages.failedToDelete'));
    }
  };

  const isSaving = isLocked('article-save');
  const isBusy = isLocked();

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button type="button" label={t('common.cancel')} severity="secondary" onClick={handleCancel} disabled={isSaving} />
      <Button type="button" label={t('common.save')} onClick={handleSubmit} loading={isSaving} disabled={isSaving} />
    </div>
  );

  const getMaterialColor = (type: string, hexCode?: string) => {
    if (hexCode) return hexCode;
    switch (type) {
      case 'PU': return '#3b82f6';
      case 'PVC': return '#ef4444';
      case 'CAOUTCHOUC': return '#10b981';
      default: return '#6b7280';
    }
  };

  const articleInfoBody = (article: Article) => {
    return (
      <div className="material-merged-cell">
        <Tag
          value={article.materialType}
          style={{ backgroundColor: getMaterialColor(article.materialType, article.colorHexCode) }}
        />
        <div className="merged-reference">{article.reference || article.name || 'N/A'}</div>
        <div className="merged-details">
          {article.nbPlis}P • {article.thicknessMm}mm • {article.colorName || 'N/A'}
        </div>
        {(article.code || article.externalId) && (
          <div className="merged-meta">
            {article.code && <span>{article.code}</span>}
            {article.code && article.externalId && <span> • </span>}
            {article.externalId && <span>{article.externalId}</span>}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title={t('navigation.articles') || 'Articles'}
          subtitle={`${totalRecords} ${t('common.list') || 'items'}`}
          actions={<Button icon="pi pi-plus" label={t('common.add')} onClick={() => setShowForm(true)} disabled={isBusy} />}
        />
      )}

      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button icon="pi pi-plus" label={t('common.add')} onClick={() => setShowForm(true)} disabled={isBusy} />
        </div>
      )}

      {error ? <Message severity="error" text={error} /> : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '420px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder={t('common.search')}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable
        value={articles}
        dataKey="id"
        paginator
        lazy
        first={page * pageSize}
        rows={pageSize}
        totalRecords={totalRecords}
        rowsPerPageOptions={[10, 25, 50]}
        onPage={(e) => {
          setPage(e.page ?? 0);
          if (e.rows && e.rows !== pageSize) {
            setPageSize(e.rows);
          }
        }}
        emptyMessage={t('messages.noData')}
        size="small"
        className="industrial-table"
      >
        <Column header={t('navigation.articles') || 'Article'} body={articleInfoBody} sortable field="reference" />
        <Column field="updatedAt" header={t('common.updated')} body={(row: Article) => formatDate(row.updatedAt || row.createdAt || '')} sortable />
        <Column
          header={t('common.actions')}
          body={(row: Article) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button icon="pi pi-pencil" text onClick={() => handleEdit(row)} aria-label={t('common.edit')} disabled={isBusy} />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                onClick={() => handleDelete(row.id)}
                aria-label={t('common.delete')}
                loading={isLocked(`article-delete-${row.id}`)}
                disabled={isBusy}
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={editingId ? (t('common.edit') || 'Edit Article') : (t('common.add') || 'Add Article')}
        visible={showForm}
        onHide={handleCancel}
        footer={formFooter}
        style={{ width: 'min(680px, 95vw)' }}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="reference">{t('inventory.reference')} *</label>
            <InputText id="reference" value={formData.reference} onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="materialType">{t('commandes.material')} *</label>
              <Dropdown
                inputId="materialType"
                value={formData.materialType}
                options={materialOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.value }))}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="thicknessMm">{t('commandes.thickness')} *</label>
              <InputNumber
                inputId="thicknessMm"
                value={formData.thicknessMm}
                onValueChange={(e) => setFormData((prev) => ({ ...prev, thicknessMm: e.value ?? 0 }))}
                min={0.1}
                step={0.1}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="nbPlis">{t('commandes.plies')} *</label>
              <InputNumber inputId="nbPlis" value={formData.nbPlis} onValueChange={(e) => setFormData((prev) => ({ ...prev, nbPlis: e.value ?? 0 }))} min={1} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="name">{t('common.name')}</label>
              <InputText id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="code">Code</label>
              <InputText id="code" value={formData.code} onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="externalId">External ID</label>
              <InputText id="externalId" value={formData.externalId} onChange={(e) => setFormData((prev) => ({ ...prev, externalId: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="colorId">{t('inventory.color')}</label>
              <Dropdown
                id="colorId"
                value={formData.colorId}
                options={colors}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => setFormData((prev) => ({ ...prev, colorId: e.value }))}
                placeholder={t('inventory.selectColor')}
                filter
                showClear
                itemTemplate={(option: Color) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: option.hexCode }} />
                    <span>{option.name}</span>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default ArticlesPage;
