"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, DollarSign, FileText, Settings, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRODUCT_CATEGORIES = {
  BEER: 'beer',
  WINE: 'wine',
  SPIRITS: 'spirits',
  LIQUEUR: 'liqueur',
  COCKTAIL: 'cocktail',
  READY_TO_DRINK: 'ready_to_drink',
  NON_ALCOHOLIC: 'non_alcoholic',
  TOBACCO: 'tobacco',
  SNACKS: 'snacks',
  MERCHANDISE: 'merchandise',
} as const;

const UNIT_TYPES = {
  BOTTLE: 'bottle',
  CRATE: 'crate',
  CARTON: 'carton',
  SHOT: 'shot',
  GLASS: 'glass',
  PINT: 'pint',
  LITRE: 'litre',
  ML: 'ml',
  CAN: 'can',
  KEG: 'keg',
  CASE: 'case',
} as const;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Basic Info
  sku: string;
  name: string;
  description: string;
  category: keyof typeof PRODUCT_CATEGORIES;
  brand: string;
  origin: string;

  // Product Details
  volume: number;
  unitType: keyof typeof UNIT_TYPES;
  conversionRate: number;
  alcoholContent: number;

  // Pricing
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  retailPrice?: number;

  // Compliance & Settings
  isAlcoholic: boolean;
  exciseDutyCategory: 'beer' | 'wine' | 'spirits' | 'cider' | 'none';
  taxRate: number;
  trackExpiry: boolean;
  expiryWarningDays: number;

  // Additional
  barcode: string;
  images: string;
  tags: string;
}

const defaultValues: FormData = {
  sku: '',
  name: '',
  description: '',
  category: 'BEER',
  brand: '',
  origin: '',
  volume: 750,
  unitType: 'BOTTLE',
  conversionRate: 1,
  alcoholContent: 0,
  costPrice: 0,
  sellingPrice: 0,
  wholesalePrice: undefined,
  retailPrice: undefined,
  isAlcoholic: true,
  exciseDutyCategory: 'spirits',
  taxRate: 16,
  trackExpiry: false,
  expiryWarningDays: 30,
  barcode: '',
  images: '',
  tags: '',
};

const categoryOptions = Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => ({
  value,
  label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' '),
}));

const unitTypeOptions = Object.entries(UNIT_TYPES).map(([key, value]) => ({
  value,
  label: key.charAt(0) + key.slice(1).toLowerCase(),
}));

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues,
  });

  const watchIsAlcoholic = watch('isAlcoholic');
  const watchTrackExpiry = watch('trackExpiry');
  const watchCostPrice = watch('costPrice');
  const watchSellingPrice = watch('sellingPrice');

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const productData = {
        ...data,
        images: data.images ? data.images.split(',').map((url) => url.trim()) : [],
        tags: data.tags ? data.tags.split(',').map((tag) => tag.trim().toLowerCase()) : [],
        // branchId will be set from auth context in the backend
      };

      const response = await api.post('/products', productData);
      const result = response.data;

      if (result.success) {
        toast.success('Product created successfully');
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      const message = error.response?.data?.error || 'Failed to create product';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: 0, title: 'Basic Info', icon: Package, fields: ['sku', 'name', 'description', 'category', 'brand', 'origin'] },
    { id: 1, title: 'Product Details', icon: FileText, fields: ['volume', 'unitType', 'conversionRate', 'alcoholContent'] },
    { id: 2, title: 'Pricing', icon: DollarSign, fields: ['costPrice', 'sellingPrice', 'wholesalePrice', 'retailPrice'] },
    { id: 3, title: 'Compliance', icon: Settings, fields: ['isAlcoholic', 'exciseDutyCategory', 'taxRate', 'trackExpiry', 'expiryWarningDays'] },
    { id: 4, title: 'Additional', icon: Tag, fields: ['barcode', 'images', 'tags'] },
  ];

  const currentSection = sections[activeSection];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-dark-200 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Product</h2>
            <p className="text-sm text-gray-400 mt-1">Fill in the product details below</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-dark-100 border-r border-gray-800 p-4 space-y-2 overflow-y-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <currentSection.icon size={20} />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-white">{currentSection.title}</h3>
                  <p className="text-xs text-gray-400">
                    {activeSection === 0 && 'Enter basic product information'}
                    {activeSection === 1 && 'Specify product measurements and attributes'}
                    {activeSection === 2 && 'Set pricing details'}
                    {activeSection === 3 && 'Configure compliance and tax settings'}
                    {activeSection === 4 && 'Additional metadata and media'}
                  </p>
                </div>
              </div>

              {/* Basic Info Fields */}
              {activeSection === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('sku', { required: 'SKU is required' })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., BRW-001"
                      />
                      {errors.sku && <p className="mt-1 text-xs text-red-400">{errors.sku.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Product name is required' })}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Captain Morgan Rum"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Brief product description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        {...register('brand')}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Diageo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country of Origin
                      </label>
                      <input
                        type="text"
                        {...register('origin')}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Jamaica"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product Details Fields */}
              {activeSection === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Volume (ml) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('volume', {
                          required: 'Volume is required',
                          min: { value: 1, message: 'Volume must be positive' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="750"
                      />
                      {errors.volume && <p className="mt-1 text-xs text-red-400">{errors.volume.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unit Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('unitType', { required: 'Unit type is required' })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {unitTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.unitType && <p className="mt-1 text-xs text-red-400">{errors.unitType.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Conversion Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('conversionRate', {
                        required: 'Conversion rate is required',
                        min: { value: 1, message: 'Must be at least 1' },
                      })}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="How many units of smaller measure in this unit"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Example: 1 bottle = 30 shots
                    </p>
                    {errors.conversionRate && <p className="mt-1 text-xs text-red-400">{errors.conversionRate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Alcohol Content (%)
                    </label>
                    <input
                      type="number"
                      {...register('alcoholContent', {
                        min: { value: 0, message: 'Must be 0-100' },
                        max: { value: 100, message: 'Must be 0-100' },
                      })}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 40"
                    />
                    {errors.alcoholContent && <p className="mt-1 text-xs text-red-400">{errors.alcoholContent.message}</p>}
                  </div>
                </div>
              )}

              {/* Pricing Fields */}
              {activeSection === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cost Price (KES) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('costPrice', {
                          required: 'Cost price is required',
                          min: { value: 0, message: 'Must be positive' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.costPrice && <p className="mt-1 text-xs text-red-400">{errors.costPrice.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Selling Price (KES) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('sellingPrice', {
                          required: 'Selling price is required',
                          min: { value: 0, message: 'Must be positive' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.sellingPrice && <p className="mt-1 text-xs text-red-400">{errors.sellingPrice.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Wholesale Price (KES)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('wholesalePrice', {
                          min: { value: 0, message: 'Must be positive' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Retail Price (KES)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('retailPrice', {
                          min: { value: 0, message: 'Must be positive' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Profit Margin Preview */}
                  {watchCostPrice && watchSellingPrice && (
                    <div className="p-4 bg-dark-100 border border-gray-800 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Estimated Profit Margin</span>
                        <span className="text-white font-semibold">
                          {((watchSellingPrice - watchCostPrice) / watchSellingPrice * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Compliance Fields */}
              {activeSection === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-100 border border-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Alcoholic Product</p>
                      <p className="text-xs text-gray-400">Subject to excise duty and age restrictions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isAlcoholic')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {watchIsAlcoholic && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Excise Duty Category
                      </label>
                      <select
                        {...register('exciseDutyCategory')}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="none">None</option>
                        <option value="beer">Beer</option>
                        <option value="wine">Wine</option>
                        <option value="spirits">Spirits</option>
                        <option value="cider">Cider</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tax Rate (VAT %)
                    </label>
                    <input
                      type="number"
                      {...register('taxRate', {
                        min: { value: 0, message: 'Must be 0-100' },
                        max: { value: 100, message: 'Must be 0-100' },
                      })}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="16"
                    />
                    {errors.taxRate && <p className="mt-1 text-xs text-red-400">{errors.taxRate.message}</p>}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-100 border border-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Track Expiry</p>
                      <p className="text-xs text-gray-400">Enable expiry date tracking for this product</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('trackExpiry')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {watchTrackExpiry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Expiry Warning (days before)
                      </label>
                      <input
                        type="number"
                        {...register('expiryWarningDays', {
                          min: { value: 1, message: 'Must be at least 1 day' },
                        })}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="30"
                      />
                      {errors.expiryWarningDays && <p className="mt-1 text-xs text-red-400">{errors.expiryWarningDays.message}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Fields */}
              {activeSection === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      {...register('barcode')}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 5901234123457"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image URLs (comma-separated)
                    </label>
                    <textarea
                      {...register('images')}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      {...register('tags')}
                      className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="popular, premium, seasonal"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                  disabled={activeSection === 0}
                  className="px-6 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {activeSection < sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection + 1)}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Product'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
