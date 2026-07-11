import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { productsApi } from "../../services/api";

const CreateProductPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingImage(true);

      const localPreview = URL.createObjectURL(file);
      setImagePreview(localPreview);

      const uploadForm = new FormData();
      uploadForm.append("image", file);

      const response = await productsApi.uploadImage(uploadForm);

      const imageUrl =
        response?.data?.imageUrl ||
        response?.data?.image_url ||
        "";

      setFormData((prev) => ({
        ...prev,
        image_url: imageUrl,
      }));

      toast.success("Image uploaded");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return productsApi.create({
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price || 0),
        image_url: formData.image_url,
      });
    },

    onSuccess: () => {
      toast.success("Product created successfully");
      navigate("/products");
    },

    onError: (error: any) => {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to create product"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sku.trim()) {
      toast.error("SKU wajib diisi");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Tambah Produk
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>

            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="SKU-001"
            />
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nama Produk"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="100000"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>

            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Deskripsi produk..."
            />
          </div>

          {/* Upload Gambar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Produk
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {uploadingImage && (
              <p className="text-sm text-blue-600 mt-2">
                Uploading image...
              </p>
            )}

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-40 w-40 object-cover rounded-lg border"
                />
              </div>
            )}

            {formData.image_url && (
              <div className="mt-2">
                <p className="text-xs text-green-600 break-all">
                  {formData.image_url}
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                uploadingImage
              }
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending
                ? "Menyimpan..."
                : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;