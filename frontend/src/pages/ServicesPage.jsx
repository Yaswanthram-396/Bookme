import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  listServices,
  createServices,
  updateServices,
  deleteServices,
} from "../api/services";
import { useToast } from "../context/Toastcontext";
import { Plus, Pencil, Trash2, Clock, IndianRupee, X } from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  duration: 30,
  price: 0,
  bufferBefore: 0,
  bufferAfter: 0,
};

const inputClass =
  "premium-input w-full";

export default function ServicesPage() {
  const { showToast } = useToast() || {};
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listServices();
      setServices(data.services || []);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to load services", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (service) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      bufferBefore: service.bufferBefore || 0,
      bufferAfter: service.bufferAfter || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.duration) {
      showToast?.("Name and duration are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        price: Number(form.price) || 0,
        bufferBefore: Number(form.bufferBefore) || 0,
        bufferAfter: Number(form.bufferAfter) || 0,
      };
      if (editingId) {
        await updateServices(editingId, payload);
        showToast?.("Service updated", "success");
      } else {
        await createServices(payload);
        showToast?.("Service created", "success");
      }
      closeForm();
      load();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to save service", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service) => {
    try {
      await updateServices(service._id, { isActive: !service.isActive });
      setServices((prev) =>
        prev.map((s) => (s._id === service._id ? { ...s, isActive: !s.isActive } : s)),
      );
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to update service", "error");
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    try {
      await deleteServices(service._id);
      setServices((prev) => prev.filter((s) => s._id !== service._id));
      showToast?.("Service deleted", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to delete service", "error");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Services</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage what customers can book on your page.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="premium-btn-primary text-sm px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add service
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : services.length === 0 ? (
          <div className="premium-card border-dashed bg-transparent py-16 text-center shadow-none">
            <p className="text-sm text-slate-500">
              No services yet. Add your first one to start accepting bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service._id}
                className="premium-card flex items-center justify-between p-5"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-800">{service.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        service.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-1 text-xs text-slate-500">{service.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {service.duration} min
                    </span>
                    <span className="flex items-center gap-0.5">
                      <IndianRupee className="h-3.5 w-3.5" /> {service.price || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(service)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      service.isActive
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {service.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(service)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service)}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingId ? "Edit service" : "New service"}
                </h2>
                <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[13px] font-bold text-slate-700">Name</label>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Consultation"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-700">Description</label>
                  <input
                    className={inputClass}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">Duration (min)</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={5}
                      value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">Price (₹)</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">Buffer before</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={form.bufferBefore}
                      onChange={(e) => setForm((f) => ({ ...f, bufferBefore: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">Buffer after</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={form.bufferAfter}
                      onChange={(e) => setForm((f) => ({ ...f, bufferAfter: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="premium-btn-primary w-full mt-2 disabled:opacity-70"
                >
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create service"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
