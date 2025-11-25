'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, ChevronDown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';
import Image from 'next/image';

const schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(4000),
  price: z.coerce.number().positive(),
  currency: z.enum(['USD', 'EUR', 'RUB', 'MDL']),
  condition: z.enum(['NEW', 'USED']),
  categoryId: z.string().min(1),
  cityId: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  // This validation will be enhanced in the component to check category
  // For now, just validate expiresAt if provided
  if (data.expiresAt) {
    const now = new Date();
    const maxExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    if (data.expiresAt <= now || data.expiresAt > maxExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время размещения должно быть в будущем и не более чем через 48 часов',
        path: ['expiresAt'],
      });
    }
  }
});

type FormValues = z.infer<typeof schema>;

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
};

type City = {
  id: string;
  name: string;
};

const MAX_IMAGES = 8;

export default function CreateAdPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { locale } = useLocale();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customCityInput, setCustomCityInput] = useState('');
  const [creatingCity, setCreatingCity] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'USD',
      condition: 'NEW',
    },
  });

  const watchedValues = watch();

  // Check if selected category is "Отдых и события" or its child
  const allCategories = categories.flatMap((p) => [p, ...(p.children || [])]);
  const selectedCategory = allCategories.find((c) => c.id === watchedValues.categoryId);
  const entertainmentParent = categories.find(p => p.slug === 'entertainment-events');
  const isEntertainmentCategory = selectedCategory && entertainmentParent && 
    (selectedCategory.slug === 'entertainment-events' || 
     selectedCategory.parentId === entertainmentParent.id ||
     entertainmentParent.children?.some(c => c.id === selectedCategory.id));

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [categoriesRes, citiesRes] = await Promise.all([fetch('/api/categories'), fetch('/api/cities')]);
        
        if (!categoriesRes.ok || !citiesRes.ok) {
          throw new Error('Failed to load data');
        }
        
        const categoriesData = await categoriesRes.json();
        const citiesData = await citiesRes.json();

        const tree = categoriesData
          .filter((cat: Category) => !cat.parentId)
          .map((parent: Category) => ({
            ...parent,
            children: categoriesData.filter((child: Category) => child.parentId === parent.id),
          }));

        setCategories(tree);
        setCities(citiesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Не удалось загрузить справочники');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleCreateCity = async () => {
    if (!customCityInput.trim()) {
      toast.error('Введите название города');
      return;
    }

    setCreatingCity(true);
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: customCityInput.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create city');
      }

      const newCity = await response.json();
      setCities((prev) => [...prev, newCity].sort((a, b) => a.name.localeCompare(b.name)));
      setValue('cityId', newCity.id);
      setCustomCityInput('');
      toast.success(`Город "${newCity.name}" добавлен`);
    } catch (error: any) {
      toast.error(error.message || 'Не удалось создать город');
    } finally {
      setCreatingCity(false);
    }
  };

  const featuredPreview = useMemo(
    () => {
      const currencySymbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        RUB: '₽',
        MDL: 'L',
      };
      
      const currency = watchedValues.currency || 'USD';
      const symbol = currencySymbols[currency] || currency;
      const price = watchedValues.price 
        ? `${symbol}${Number(watchedValues.price).toFixed(2)}` 
        : `${symbol}0.00`;
      
      return {
        title: watchedValues.title || 'Новая публикация',
        price,
        city: cities.find((city) => city.id === watchedValues.cityId)?.name || 'Город',
        condition: watchedValues.condition === 'USED' ? 'Б/У' : 'Новое',
      };
    },
    [watchedValues, cities]
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      toast.error(`Можно загрузить не более ${MAX_IMAGES} изображений`);
      return;
    }

    setUploading(true);
    try {
      const uploads = files.slice(0, availableSlots).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
        const data = await res.json();
        return data.url as string;
      });

      const urls = await Promise.all(uploads);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`Загружено ${urls.length} фото`);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    if (!images.length) {
      toast.error('Добавьте хотя бы одно фото');
      return;
    }

    // Validate entertainment category requirements
    if (isEntertainmentCategory) {
      // Check if a subcategory is selected (not the parent)
      if (!selectedCategory?.parentId) {
        toast.error('Пожалуйста, выберите подкатегорию для категории "Отдых и события"');
        return;
      }
      
      // Check if expiresAt is provided
      if (!values.expiresAt) {
        toast.error('Для категории "Отдых и события" необходимо указать время размещения объявления');
        return;
      }

      // Validate 48 hours limit
      const now = new Date();
      const maxExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      if (values.expiresAt > maxExpiry) {
        toast.error('Время размещения не может превышать 48 часов от текущего момента');
        return;
      }
    }

    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...values, 
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
          imageUrls: images 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Не удалось создать объявление');
      }

      const ad = await res.json();
      const status = ad.status === 'APPROVED' ? 'approved' : 'pending';
      router.push(`/ads/success?adId=${ad.slug}-${ad.id}&status=${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании объявления');
    }
  };

  if (!session?.user) {
    return (
      <div className="container-custom py-16 text-center text-neutral-400">
        <p>Войдите через Google, чтобы публиковать объявления.</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-12 space-y-8">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary-300">Create Listing</p>
        <h1 className="text-4xl font-semibold text-white">Добавьте новое объявление</h1>
        <p className="text-neutral-400">
          Точный заголовок, хорошие фото и указание города помогают модерации и покупателям.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[32px] border border-neutral-900 bg-[#05070f] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Заголовок *</label>
            <input
              {...register('title')}
              className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
              placeholder="Organic sourdough loaf 900 г"
            />
            {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Описание *</label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
              placeholder="Расскажите, что включено, в каком состоянии товар, как быстро доставите..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Цена *</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                className="flex-1 rounded-2xl border border-neutral-800 bg-dark-bg text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none px-4 py-3"
                placeholder="0.00"
              />
              <select
                {...register('currency')}
                className="rounded-2xl border border-primary-500/50 bg-dark-bg2 text-white font-semibold focus:border-primary-500 focus:outline-none px-4 py-3 cursor-pointer appearance-none bg-no-repeat bg-right pr-10 min-w-[110px] hover:border-primary-500 transition"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25em 1.25em',
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
                <option value="MDL">MDL</option>
              </select>
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Состояние *</label>
            <div className="flex gap-2">
              {['NEW', 'USED'].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setValue('condition', option as 'NEW' | 'USED')}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    watchedValues.condition === option
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-neutral-800 bg-dark-bg text-neutral-500 hover:border-primary-500/40'
                  }`}
                >
                  {option === 'NEW' ? 'Новое' : 'Б/У'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Город *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    {...register('cityId')}
                    disabled={loading}
                    onChange={(e) => {
                      setValue('cityId', e.target.value);
                      if (e.target.value === 'custom') {
                        setCustomCityInput('');
                      }
                    }}
                    className="flex-1 rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Выберите город</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                    <option value="custom">+ Добавить свой город</option>
                  </select>
                </div>
                {watchedValues.cityId === 'custom' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCityInput}
                      onChange={(e) => setCustomCityInput(e.target.value)}
                      placeholder="Введите название города"
                      className="flex-1 rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && customCityInput.trim()) {
                          e.preventDefault();
                          await handleCreateCity();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCity}
                      disabled={!customCityInput.trim() || creatingCity}
                      className="rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingCity ? 'Создание...' : 'Добавить'}
                    </button>
                  </div>
                )}
              </div>
              {errors.cityId && <p className="mt-1 text-sm text-red-400">{errors.cityId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Категория *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExpandedCategory((prev) => (prev ? null : 'open'))}
                  className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-left text-white focus:border-primary-500 focus:outline-none flex items-center justify-between hover:border-neutral-700 transition"
                >
                  <span className={watchedValues.categoryId ? '' : 'text-neutral-500'}>
                    {watchedValues.categoryId
                      ? (() => {
                          const selected = categories
                            .flatMap((p) => [p, ...(p.children || [])])
                            .find((c) => c.id === watchedValues.categoryId);
                          return selected?.name || 'Выберите категорию';
                        })()
                      : 'Выберите категорию'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition ${expandedCategory ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {expandedCategory && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setExpandedCategory(null)}
                    />
                    <div className="absolute z-20 w-full mt-2 rounded-2xl border border-neutral-800 bg-dark-bg shadow-xl max-h-80 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                          Загрузка категорий...
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                          Категории не найдены
                        </div>
                      ) : (
                        categories.map((parent) => (
                          <div key={parent.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (parent.children && parent.children.length > 0) {
                                  // Always expand to show children
                                  setExpandedCategory(parent.id);
                                } else {
                                  setValue('categoryId', parent.id);
                                  setExpandedCategory(null);
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition ${
                                watchedValues.categoryId === parent.id && !(parent.slug === 'entertainment-events')
                                  ? 'bg-primary-500/20 text-primary-300 font-semibold'
                                  : 'text-white hover:bg-dark-bg2'
                              } ${parent.slug === 'entertainment-events' ? 'opacity-90 cursor-pointer' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{parent.name}</span>
                                {parent.children && parent.children.length > 0 && (
                                  <ChevronDown
                                    className={`h-4 w-4 transition ${
                                      expandedCategory === parent.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                )}
                              </div>
                            </button>
                            {expandedCategory === parent.id && parent.children && parent.children.length > 0 && (
                              <div className="bg-dark-bg2 pl-6 border-t border-neutral-800">
                                {parent.children.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => {
                                      setValue('categoryId', child.id);
                                      setExpandedCategory(null);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition ${
                                      watchedValues.categoryId === child.id
                                        ? 'bg-primary-500/20 text-primary-300 font-semibold'
                                        : 'text-neutral-400 hover:bg-primary-500/10 hover:text-white'
                                    }`}
                                  >
                                    {child.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              {errors.categoryId && <p className="mt-1 text-sm text-red-400">{errors.categoryId.message}</p>}
              {isEntertainmentCategory && (
                <div className="mt-3 rounded-2xl border border-primary-500/30 bg-primary-500/5 p-4">
                  <p className="text-sm text-primary-300 font-medium mb-2">
                    ℹ️ Категория "Отдых и события"
                  </p>
                  <p className="text-sm text-neutral-400">
                    Эта категория предназначена для размещения объявлений о местах отдыха, кафе и подобных заведениях, а также мероприятий для развлечения. В данной категории действуют особые правила: ограничение времени размещения до 48 часов и лимит 1 объявление в день. Для размещения большего количества объявлений свяжитесь с нами: @pmrmarketsupport или pmrmarket@proton.me
                  </p>
                  {selectedCategory && selectedCategory.parentId && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Выбрана подкатегория: {selectedCategory.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEntertainmentCategory && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Время размещения объявления *
              </label>
              <input
                type="datetime-local"
                {...register('expiresAt', { 
                  required: 'Укажите время размещения объявления',
                  valueAsDate: true 
                })}
                min={new Date().toISOString().slice(0, 16)}
                max={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
              />
              {errors.expiresAt && <p className="mt-1 text-sm text-red-400">{errors.expiresAt.message}</p>}
              <p className="mt-1 text-xs text-neutral-500">
                Максимальное время размещения: 48 часов от текущего момента
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Фотографии *</label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {images.map((url, index) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-2xl border border-neutral-800">
                  <Image
                    src={url}
                    alt={`photo-${index}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 z-10"
                    title="Удалить"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-700 bg-dark-bg text-sm text-neutral-500 transition hover:border-primary-500">
                  <Upload className="mb-2 h-6 w-6" />
                  {uploading ? 'Загрузка...' : 'Добавить фото'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <p className="mt-2 text-sm text-neutral-500">До {MAX_IMAGES} изображений, JPG/PNG до 5MB</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#080c16] p-4 text-sm text-neutral-400 space-y-3">
            <div className="flex items-center gap-3 text-white">
              <ShieldCheck className="h-5 w-5 text-primary-400" />
              <p>Публикуя объявление, вы соглашаетесь с правилами PMR Market и даёте согласие на модерацию.</p>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-5 w-5 text-primary-400" />
              <p>Только точная информация и реальные фото ускоряют одобрение.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-2xl border border-neutral-800 px-6 py-3 text-sm font-semibold text-white transition hover:border-primary-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Публикуем…' : 'Опубликовать'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-neutral-900 bg-[#0b101c] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Превью</p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-neutral-800 bg-[#05070f]">
              <div className="relative aspect-[4/3]">
                {images[0] ? (
                  <Image src={images[0]} alt="preview" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-dark-bg text-neutral-600">
                    Добавьте фото
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white">
                  {featuredPreview.condition}
                </div>
              </div>
              <div className="space-y-2 p-4">
                <h3 className="text-xl font-semibold text-white">{featuredPreview.title}</h3>
                <p className="text-lg font-bold text-white">{featuredPreview.price}</p>
                <p className="text-sm text-neutral-500">{featuredPreview.city}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-6 text-sm text-neutral-400">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Советы</p>
            <ul className="mt-4 space-y-2">
              <li>Укажите точный город — так объявление покажется нужным людям быстрее.</li>
              <li>Добавьте минимум 3-4 фото, показывающих товар с разных сторон.</li>
              <li>Упомяните состояние, комплектацию, гарантию и способы передачи.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

