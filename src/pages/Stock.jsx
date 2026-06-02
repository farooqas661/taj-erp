import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Topbar from "../components/Topbar";

export default function Stock() {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("KG");
  const [supplier, setSupplier] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchStock = async () => {
    const { data, error } = await supabase
      .from("stock")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      setItems(data || []);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const addMaterial = async () => {
    const { error } = await supabase
      .from("stock")
      .insert([
        {
          item_name: itemName,
          category: category,
          quantity: Number(quantity),
          unit: unit,
          supplier: supplier,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Material Added");

    setItemName("");
    setCategory("");
    setQuantity("");
    setUnit("KG");
    setSupplier("");
    setShowForm(false);

    fetchStock();
  };

  return (
    <div>
      <Topbar title="Stock Management" />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-8">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-black">
            Raw Materials
          </h1>

          <div className="flex gap-3 flex-wrap">

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-2xl bg-green-600 font-bold"
            >
              + Add Material
            </button>

            <button
              onClick={() => alert("Receive Stock - Coming Soon")}
              className="px-5 py-3 rounded-2xl bg-blue-600 font-bold"
            >
              + Receive Stock
            </button>

            <button
              onClick={() => alert("Issue Material - Coming Soon")}
              className="px-5 py-3 rounded-2xl bg-orange-600 font-bold"
            >
              Issue Material
            </button>

            <button
              onClick={() => alert("Low Stock - Coming Soon")}
              className="px-5 py-3 rounded-2xl bg-red-600 font-bold"
            >
              Low Stock
            </button>

          </div>
        </div>

        {showForm && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                placeholder="Material Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="bg-black/30 p-3 rounded-xl"
              />

              <input
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-black/30 p-3 rounded-xl"
              />

              <input
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-black/30 p-3 rounded-xl"
              />

              <input
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-black/30 p-3 rounded-xl"
              />

              <input
                placeholder="Supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="bg-black/30 p-3 rounded-xl"
              />

            </div>

            <button
              onClick={addMaterial}
              className="mt-5 px-6 py-3 bg-green-600 rounded-2xl font-bold"
            >
              Save Material
            </button>

          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[30px] border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-2xl font-black">
                {item.item_name}
              </h2>

              <p className="text-white/60 mt-2">
                Category: {item.category}
              </p>

              <p className="text-white/60">
                Quantity: {item.quantity} {item.unit}
              </p>

              <p className="text-white/60">
                Supplier: {item.supplier}
              </p>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}