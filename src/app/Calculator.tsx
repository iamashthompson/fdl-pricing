"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const BRAND = {
  green: "#2D5F2D",
  greenLight: "#E8F0E8",
  cream: "#FFF8E7",
  coral: "#FF6F61",
  white: "#FFFFFF",
  text: "#2D2D2D",
  muted: "#888888",
  border: "#D4D4C8",
};

const WEIGHT_CONVERSIONS: Record<string, number> = { g: 1, oz: 28.35, lb: 453.59 };
const VOLUME_ML: Record<string, number> = { ml: 1, tsp: 4.93, tbsp: 14.79, cup: 236.59, fl_oz: 29.57, qt: 946.35, gal: 3785.41 };
const DENSITY: Record<string, number> = {
  "all-purpose flour": 0.53, "bread flour": 0.55, "almond flour": 0.48, "powdered sugar": 0.56,
  "sugar": 0.85, "granulated sugar": 0.85, "brown sugar": 0.83, "light brown sugar": 0.83,
  "dark brown sugar": 0.83, "butter": 0.91, "unsalted butter": 0.91, "milk": 1.03,
  "whole milk": 1.03, "cream": 1.01, "heavy cream": 1.01, "whipping cream": 1.01,
  "heavy whipping cream": 1.01, "cream cheese": 1.02, "vegetable oil": 0.92, "honey": 1.42,
  "vanilla extract": 1.04, "vanilla bean paste": 1.10, "water": 1.0, "salt": 1.22,
  "cinnamon": 0.56, "cocoa powder": 0.52, "baking powder": 0.90, "baking soda": 1.10,
  "eggs": 1.03, "xanthan gum": 0.50, "corn syrup": 1.38, "sour cream": 1.06,
  "ginger": 0.50, "nutmeg": 0.53, "pineapple": 1.05, "lemon": 1.03, "carrot": 0.64, "pecan": 0.45,
  "corn starch": 0.54, "chocolate": 0.90, "dark chocolate": 0.90,
};

function getDensity(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(DENSITY)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function isWeight(unit: string) { return unit in WEIGHT_CONVERSIONS; }
function isVolume(unit: string) { return unit in VOLUME_ML; }
function isCount(unit: string) { return ["egg", "piece", "each", "doz"].includes(unit); }

function convertUnits(amount: number, fromUnit: string, toUnit: string, ingredientName: string): number | null {
  if (fromUnit === toUnit) return amount;
  if (fromUnit === "doz") { if (isCount(toUnit)) return amount * 12; return null; }
  if (toUnit === "doz") { if (isCount(fromUnit)) return amount / 12; return null; }
  if (isCount(fromUnit) && isCount(toUnit)) return amount;
  if (isWeight(fromUnit) && isWeight(toUnit)) return amount * WEIGHT_CONVERSIONS[fromUnit] / WEIGHT_CONVERSIONS[toUnit];
  if (isVolume(fromUnit) && isVolume(toUnit)) return amount * VOLUME_ML[fromUnit] / VOLUME_ML[toUnit];
  const density = getDensity(ingredientName || "");
  if (!density) return null;
  if (isWeight(fromUnit) && isVolume(toUnit)) { const g = amount * WEIGHT_CONVERSIONS[fromUnit]; return (g / density) / VOLUME_ML[toUnit]; }
  if (isVolume(fromUnit) && isWeight(toUnit)) { const ml = amount * VOLUME_ML[fromUnit]; return (ml * density) / WEIGHT_CONVERSIONS[toUnit]; }
  return null;
}

interface Ingredient { id: number; name: string; price: number; size: number; unit: string; }
interface RecipeIngredient { ingredientId: number; amount: number; recipeUnit: string; }
interface SellingOption { name: string; qty: number; packagingCost: number; yourPrice: string; }
interface Recipe { id: number; name: string; batchYield: number; laborHours: number; hourlyRate: number; overheadCost: number; sellingOptions: SellingOption[]; ingredients: RecipeIngredient[]; }

function getLineCost(amount: number, recipeUnit: string, ingredient: Ingredient, includeTax: boolean, taxRate: number): number | null {
  if (!ingredient || !ingredient.size || ingredient.size === 0) return null;
  const base = ingredient.price / ingredient.size;
  const price = includeTax ? base * (1 + taxRate / 100) : base;
  const converted = convertUnits(amount, recipeUnit, ingredient.unit, ingredient.name);
  if (converted === null) return null;
  return converted * price;
}

const defaultIngredients: Ingredient[] = [
  { id: 1, name: "All-Purpose Flour", price: 8.48, size: 25, unit: "lb" },
  { id: 2, name: "Bread Flour", price: 8.98, size: 10, unit: "lb" },
  { id: 3, name: "Butter (unsalted)", price: 8.44, size: 4, unit: "lb" },
  { id: 4, name: "Sugar (granulated)", price: 6.58, size: 10, unit: "lb" },
  { id: 5, name: "Powdered Sugar", price: 6.98, size: 7, unit: "lb" },
  { id: 6, name: "Whipping Cream", price: 5.77, size: 64, unit: "oz" },
  { id: 7, name: "Whole Milk", price: 3.94, size: 1, unit: "gal" },
  { id: 8, name: "Philadelphia Cream Cheese", price: 4.86, size: 16, unit: "oz" },
  { id: 9, name: "Kerrygold Unsalted Butter", price: 12.22, size: 24, unit: "oz" },
  { id: 10, name: "Kerrygold Salted Butter", price: 12.22, size: 24, unit: "oz" },
  { id: 11, name: "Light Brown Sugar", price: 6.98, size: 7, unit: "lb" },
  { id: 12, name: "Dark Brown Sugar (Wal Mart)", price: 2.82, size: 32, unit: "oz" },
  { id: 13, name: "Eggs (Sams)", price: 7.54, size: 60, unit: "egg" },
  { id: 14, name: "Heavy Whipping Cream", price: 4.39, size: 16, unit: "oz" },
  { id: 15, name: "Sam's Cream Cheese", price: 6.27, size: 48, unit: "oz" },
  { id: 16, name: "Magnolia Star Vanilla Extract", price: 9.98, size: 8, unit: "oz" },
  { id: 17, name: "Salt", price: 1.99, size: 26, unit: "oz" },
  { id: 18, name: "Cocoa Powder", price: 7.99, size: 8, unit: "oz" },
  { id: 19, name: "Baking Powder", price: 3.99, size: 8.1, unit: "oz" },
  { id: 20, name: "Baking Soda", price: 1.99, size: 16, unit: "oz" },
  { id: 21, name: "Almond Flour", price: 8.99, size: 16, unit: "oz" },
  { id: 22, name: "Carrots", price: 2.99, size: 2, unit: "lb" },
  { id: 23, name: "Pecans", price: 9.99, size: 16, unit: "oz" },
  { id: 24, name: "Nielsen Massey Vanilla Bean Paste", price: 36.95, size: 4, unit: "oz" },
  { id: 25, name: "Vanilla Cuts/Pieces", price: 29.18, size: 47, unit: "g" },
  { id: 26, name: "Xanthum Gum (Gneiss Spice)", price: 2.92, size: 1, unit: "tsp" },
  { id: 27, name: "GV Light Corn Syrup", price: 2.54, size: 16, unit: "oz" },
  { id: 28, name: "BRM Active Dry Yeast", price: 9.99, size: 8, unit: "oz" },
  { id: 29, name: "Sam's Honey", price: 7.98, size: 48, unit: "oz" },
  { id: 30, name: "Sam's Ground Cinnamon", price: 7.98, size: 18, unit: "oz" },
  { id: 31, name: "Morton Sea Salt Fine", price: 2.97, size: 17.6, unit: "oz" },
  { id: 32, name: "Whole Carrots", price: 3.75, size: 5, unit: "lb" },
  { id: 33, name: "Lemons", price: 3.87, size: 3, unit: "lb" },
  { id: 34, name: "Salted Butter", price: 8.44, size: 4, unit: "lb" },
  { id: 35, name: "Dole Crushed Pineapple (Walmart)", price: 2.47, size: 20, unit: "oz" },
  { id: 36, name: "Sam's Vegetable Oil", price: 12.88, size: 192, unit: "oz" },
  { id: 37, name: "Sam's Ginger", price: 5.58, size: 7, unit: "oz" },
  { id: 38, name: "GV Nutmeg", price: 2.46, size: 1.5, unit: "oz" },
  { id: 39, name: "Cocoa Powder (Sam's)", price: 9.98, size: 23, unit: "oz" },
  { id: 40, name: "Sour Cream (Sam's)", price: 5.54, size: 48, unit: "oz" },
  { id: 41, name: "Danish Creamery Salted Butter", price: 10.99, size: 4, unit: "lb" },
  { id: 42, name: "Ghiradelli Dark Chocolate Wafers", price: 6.56, size: 10, unit: "oz" },
  { id: 43, name: "Corn Starch", price: 2.98, size: 16, unit: "oz" },
];

const defaultRecipes: Recipe[] = [
  {
    id: 1, name: "Cinnamon Rolls (Brioche)", batchYield: 12, laborHours: 2, hourlyRate: 20, overheadCost: 0.25,
    sellingOptions: [
      { name: "Single", qty: 1, packagingCost: 0.10, yourPrice: "" },
      { name: "Half Dozen", qty: 6, packagingCost: 0.50, yourPrice: "" },
      { name: "Dozen", qty: 12, packagingCost: 0.75, yourPrice: "" },
    ],
    ingredients: [],
  },
  {
    id: 2, name: "Cookies", batchYield: 12, laborHours: 2, hourlyRate: 20, overheadCost: 0.25,
    sellingOptions: [
      { name: "Single", qty: 1, packagingCost: 0.10, yourPrice: "" },
      { name: "4-Pack", qty: 4, packagingCost: 0.35, yourPrice: "" },
      { name: "Dozen", qty: 12, packagingCost: 0.75, yourPrice: "" },
    ],
    ingredients: [],
  },
];

const ALL_UNITS = ["g", "oz", "lb", "tsp", "tbsp", "cup", "fl_oz", "qt", "gal", "ml", "egg", "piece", "each"];
const fmt = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "$" + Number(n).toFixed(2);
};

export default function Calculator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients);
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipes);
  const [activeTab, setActiveTab] = useState("recipes");
  const [editingRecipe, setEditingRecipe] = useState<number | null>(null);
  const [newIngName, setNewIngName] = useState("");
  const [includeTax, setIncludeTax] = useState(true);
  const [taxRate, setTaxRate] = useState(4.0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load data from server on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/data");
        const json = await res.json();
        if (json.data) {
          if (json.data.ingredients) setIngredients(json.data.ingredients);
          if (json.data.recipes) setRecipes(json.data.recipes);
          if (json.data.includeTax !== undefined) setIncludeTax(json.data.includeTax);
          if (json.data.taxRate !== undefined) setTaxRate(json.data.taxRate);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // Save data to server (debounced)
  const saveData = useCallback(async (ings: Ingredient[], recs: Recipe[], tax: boolean, rate: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: ings, recipes: recs, includeTax: tax, taxRate: rate }),
        });
        setLastSaved(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Failed to save:", e);
      }
      setSaving(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (loaded) saveData(ingredients, recipes, includeTax, taxRate);
  }, [ingredients, recipes, includeTax, taxRate, loaded, saveData]);

  // Export data as JSON file
  const exportData = () => {
    const data = { ingredients, recipes, includeTax, taxRate };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fdl-pricing-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.ingredients) setIngredients(data.ingredients);
        if (data.recipes) setRecipes(data.recipes);
        if (data.includeTax !== undefined) setIncludeTax(data.includeTax);
        if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      } catch { alert("Invalid file"); }
    };
    input.click();
  };

  const getIngredient = (id: number) => ingredients.find((i) => i.id === id);

  const recipeLineCost = (ri: RecipeIngredient) => {
    const ing = getIngredient(ri.ingredientId);
    if (!ing) return null;
    return getLineCost(ri.amount, ri.recipeUnit, ing, includeTax, taxRate);
  };

  const recipeIngredientCost = (recipe: Recipe) => recipe.ingredients.reduce((sum, ri) => sum + (recipeLineCost(ri) || 0), 0);
  const recipeIngCostPerUnit = (recipe: Recipe) => { const c = recipeIngredientCost(recipe); return recipe.batchYield > 0 ? c / recipe.batchYield : 0; };
  const sellingOptionIngCost = (recipe: Recipe, opt: SellingOption) => (recipeIngCostPerUnit(recipe) * opt.qty) + opt.packagingCost;

  const updateRecipe = (id: number, field: string, value: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, [field]: field === "name" ? value : parseFloat(value) || 0 } : r));
  };

  const addRecipeIngredient = (recipeId: number) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ingredients: [...r.ingredients, { ingredientId: ingredients[0]?.id || 1, amount: 0, recipeUnit: "g" }] } : r));
  };

  const updateRecipeIngredient = (recipeId: number, idx: number, field: string, value: string | number) => {
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const ings = [...r.ingredients];
      ings[idx] = { ...ings[idx], [field]: field === "recipeUnit" ? value : field === "ingredientId" ? Number(value) : parseFloat(value as string) || 0 };
      return { ...r, ingredients: ings };
    }));
  };

  const removeRecipeIngredient = (recipeId: number, idx: number) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ingredients: r.ingredients.filter((_, i) => i !== idx) } : r));
  };

  const addSellingOption = (recipeId: number) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, sellingOptions: [...r.sellingOptions, { name: "New Option", qty: 1, packagingCost: 0, yourPrice: "" }] } : r));
  };

  const updateSellingOption = (recipeId: number, idx: number, field: string, value: string) => {
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const opts = [...r.sellingOptions];
      opts[idx] = { ...opts[idx], [field]: field === "name" || field === "yourPrice" ? value : parseFloat(value) || 0 };
      return { ...r, sellingOptions: opts };
    }));
  };

  const removeSellingOption = (recipeId: number, idx: number) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, sellingOptions: r.sellingOptions.filter((_, i) => i !== idx) } : r));
  };

  const addRecipe = () => {
    const newId = Math.max(0, ...recipes.map(r => r.id)) + 1;
    setRecipes(prev => [...prev, { id: newId, name: "New Product", batchYield: 12, laborHours: 2, hourlyRate: 20, overheadCost: 0.25, sellingOptions: [{ name: "Single", qty: 1, packagingCost: 0.10, yourPrice: "" }], ingredients: [] }]);
  };

  const removeRecipe = (id: number) => setRecipes(prev => prev.filter(r => r.id !== id));

  const updateIngredient = (id: number, field: string, value: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: field === "name" || field === "unit" ? value : parseFloat(value) || 0 } : i));
  };

  const addIngredient = () => {
    if (!newIngName.trim()) return;
    const newId = Math.max(0, ...ingredients.map(i => i.id)) + 1;
    setIngredients(prev => [...prev, { id: newId, name: newIngName.trim(), price: 0, size: 1, unit: "oz" }]);
    setNewIngName("");
  };

  const removeIngredient = (id: number) => setIngredients(prev => prev.filter(i => i.id !== id));

  const costPerPurchaseUnit = (ing: Ingredient) => {
    if (!ing.size || ing.size === 0) return 0;
    const base = ing.price / ing.size;
    return includeTax ? base * (1 + taxRate / 100) : base;
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${BRAND.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 14,
    fontFamily: "'Georgia', serif", background: BRAND.white, color: BRAND.text, outline: "none",
    width: "100%", boxSizing: "border-box" as const,
  };
  const smallInputStyle: React.CSSProperties = { ...inputStyle, width: 80, textAlign: "right" as const };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
        <p style={{ color: BRAND.green, fontSize: 18 }}>Loading your data...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND.cream, fontFamily: "'Georgia', serif", color: BRAND.text }}>
      <div style={{ background: BRAND.green, padding: "24px 20px", borderBottom: `3px solid ${BRAND.coral}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, color: BRAND.cream, fontSize: 28, fontWeight: 400, letterSpacing: 1 }}>Flour Deux Lis</h1>
            <p style={{ margin: "4px 0 0", color: BRAND.greenLight, fontSize: 14, fontStyle: "italic", opacity: 0.85 }}>Pricing Calculator</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: BRAND.greenLight, opacity: 0.7 }}>
              {saving ? "Saving..." : lastSaved ? `Saved ${lastSaved}` : ""}
            </span>
            <button onClick={exportData} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "6px 12px", color: BRAND.cream, cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif" }}>
              Export
            </button>
            <button onClick={importData} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "6px 12px", color: BRAND.cream, cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif" }}>
              Import
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: BRAND.white, borderBottom: `1px solid ${BRAND.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex" }}>
          {[
            { key: "recipes", label: "Recipe Costing" },
            { key: "ingredients", label: "Ingredient Prices" },
            { key: "pricelist", label: "Price List" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "14px 20px", border: "none",
              borderBottom: activeTab === tab.key ? `3px solid ${BRAND.coral}` : "3px solid transparent",
              background: "transparent", color: activeTab === tab.key ? BRAND.green : BRAND.muted,
              fontFamily: "'Georgia', serif", fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 400, cursor: "pointer",
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 80px" }}>
        {/* Tax Toggle */}
        <div style={{ background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setIncludeTax(!includeTax)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none",
              background: includeTax ? BRAND.green : BRAND.border, cursor: "pointer", position: "relative",
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: BRAND.white, position: "absolute", top: 3, left: includeTax ? 23 : 3, transition: "left 0.2s" }} />
            </button>
            <span style={{ fontSize: 14, color: BRAND.text }}>Include local grocery tax</span>
          </div>
          {includeTax && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} style={{ ...smallInputStyle, width: 60 }} />
              <span style={{ fontSize: 13, color: BRAND.muted }}>%</span>
            </div>
          )}
        </div>

        {/* RECIPES TAB */}
        {activeTab === "recipes" && (
          <div>
            {recipes.map((recipe) => {
              const ingCost = recipeIngredientCost(recipe);
              const ingPerUnit = recipeIngCostPerUnit(recipe);
              const laborTotal = recipe.laborHours * recipe.hourlyRate;
              const overheadTotal = recipe.overheadCost * recipe.batchYield;
              const isEditing = editingRecipe === recipe.id;

              return (
                <div key={recipe.id} style={{ background: BRAND.white, borderRadius: 10, marginBottom: 20, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
                  <div style={{ background: BRAND.greenLight, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${BRAND.border}` }}
                    onClick={() => setEditingRecipe(isEditing ? null : recipe.id)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, color: BRAND.green }}>{recipe.name}</h2>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: BRAND.muted }}>
                        Batch of {recipe.batchYield} · Ingredients {fmt(ingPerUnit)}/unit
                        {includeTax && <span style={{ color: BRAND.coral, fontSize: 11 }}> (incl. {taxRate}% tax)</span>}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: BRAND.muted, marginBottom: 2 }}>ingredients/unit</div>
                      <div style={{ fontSize: 22, color: BRAND.green, fontWeight: 700 }}>{fmt(ingPerUnit)}</div>
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ padding: 20 }}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, color: BRAND.muted, display: "block", marginBottom: 4 }}>Product Name</label>
                        <input value={recipe.name} onChange={(e) => updateRecipe(recipe.id, "name", e.target.value)} style={{ ...inputStyle, maxWidth: 300 }} />
                      </div>

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                        {[
                          { label: "Batch Yield", field: "batchYield", val: recipe.batchYield },
                          { label: "Labor Hours", field: "laborHours", val: recipe.laborHours },
                          { label: "Hourly Rate ($)", field: "hourlyRate", val: recipe.hourlyRate },
                          { label: "Overhead/Unit ($)", field: "overheadCost", val: recipe.overheadCost },
                        ].map((f) => (
                          <div key={f.field}>
                            <label style={{ fontSize: 11, color: BRAND.muted, display: "block", marginBottom: 3 }}>{f.label}</label>
                            <input type="number" step="any" value={f.val} onChange={(e) => updateRecipe(recipe.id, f.field, e.target.value)} style={smallInputStyle} />
                          </div>
                        ))}
                      </div>

                      {/* Ingredients Table */}
                      <div style={{ fontSize: 12, color: BRAND.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: BRAND.green }}>
                              {["Ingredient", "Amount", "Unit", "Line Cost", ""].map((h) => (
                                <th key={h} style={{ padding: "8px 10px", color: BRAND.white, fontWeight: 600, fontSize: 12, textAlign: h === "Ingredient" ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {recipe.ingredients.map((ri, idx) => {
                              const cost = recipeLineCost(ri);
                              return (
                                <tr key={idx} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                                  <td style={{ padding: "8px 10px" }}>
                                    <select value={ri.ingredientId} onChange={(e) => updateRecipeIngredient(recipe.id, idx, "ingredientId", e.target.value)}
                                      style={{ ...inputStyle, width: "100%", minWidth: 140 }}>
                                      {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "right" }}>
                                    <input type="number" step="any" value={ri.amount} onChange={(e) => updateRecipeIngredient(recipe.id, idx, "amount", e.target.value)} style={{ ...smallInputStyle, width: 70 }} />
                                  </td>
                                  <td style={{ padding: "8px 6px", textAlign: "right" }}>
                                    <select value={ri.recipeUnit} onChange={(e) => updateRecipeIngredient(recipe.id, idx, "recipeUnit", e.target.value)}
                                      style={{ ...smallInputStyle, width: 60, textAlign: "left" }}>
                                      {ALL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: cost !== null ? BRAND.green : BRAND.coral }}>
                                    {cost !== null ? fmt(cost) : "can't convert"}
                                  </td>
                                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                                    <button onClick={() => removeRecipeIngredient(recipe.id, idx)} style={{ background: "none", border: "none", color: BRAND.coral, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button onClick={() => addRecipeIngredient(recipe.id)} style={{ background: "none", border: `1px dashed ${BRAND.border}`, borderRadius: 6, padding: "8px 16px", color: BRAND.green, cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif", marginTop: 8, width: "100%" }}>
                        + Add Ingredient
                      </button>

                      {/* Batch Cost Breakdown */}
                      <div style={{ marginTop: 20, padding: 16, background: BRAND.cream, borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Batch Cost Breakdown</div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                          <span>Ingredients (batch)</span><span>{fmt(ingCost)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                          <span>Labor ({recipe.laborHours}hr × {fmt(recipe.hourlyRate)})</span><span>{fmt(laborTotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                          <span>Overhead ({recipe.batchYield} × {fmt(recipe.overheadCost)})</span><span>{fmt(overheadTotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderTop: `1px solid ${BRAND.border}`, marginTop: 6, fontSize: 14, color: BRAND.muted }}>
                          <span>Total batch cost</span><span>{fmt(ingCost + laborTotal + overheadTotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", borderTop: `2px solid ${BRAND.green}`, marginTop: 6, fontWeight: 700, fontSize: 16, color: BRAND.green }}>
                          <span>Ingredient Cost Per Unit</span><span>{fmt(ingPerUnit)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: BRAND.muted, fontStyle: "italic", marginTop: 4 }}>
                          Use 3–4× this number to set your price. That markup covers ingredients, labor, overhead, and profit.
                        </div>
                      </div>

                      {/* Selling Options */}
                      <div style={{ marginTop: 20, padding: 16, background: BRAND.white, borderRadius: 8, border: `1px solid ${BRAND.border}` }}>
                        <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Selling Options</div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                              <tr style={{ background: BRAND.green }}>
                                {["How You Sell It", "Qty", "Pkg", "Ing. Cost", "3× Price", "4× Price", "Your Price", "Hourly", ""].map((h) => (
                                  <th key={h} style={{ padding: "8px 6px", color: BRAND.white, fontWeight: 600, fontSize: 11, textAlign: h === "How You Sell It" ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(recipe.sellingOptions || []).map((opt, idx) => {
                                const ingOnly = sellingOptionIngCost(recipe, opt);
                                const price = parseFloat(opt.yourPrice) || 0;
                                const ingForQty = recipeIngCostPerUnit(recipe) * opt.qty;
                                const overheadForQty = recipe.overheadCost * opt.qty;
                                const hourlyEarned = price > 0 && recipe.laborHours > 0
                                  ? ((price - ingForQty - opt.packagingCost - overheadForQty) / recipe.laborHours) * (recipe.batchYield / opt.qty)
                                  : 0;
                                return (
                                  <tr key={idx} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                                    <td style={{ padding: "8px 6px" }}>
                                      <input value={opt.name} onChange={(e) => updateSellingOption(recipe.id, idx, "name", e.target.value)} style={{ ...inputStyle, width: "100%", minWidth: 80 }} />
                                    </td>
                                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                                      <input type="number" step="1" value={opt.qty} onChange={(e) => updateSellingOption(recipe.id, idx, "qty", e.target.value)} style={{ ...smallInputStyle, width: 45 }} />
                                    </td>
                                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                                      <input type="number" step="0.01" value={opt.packagingCost} onChange={(e) => updateSellingOption(recipe.id, idx, "packagingCost", e.target.value)} style={{ ...smallInputStyle, width: 55 }} />
                                    </td>
                                    <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 13, color: BRAND.muted }}>{fmt(ingOnly)}</td>
                                    <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 13, color: BRAND.coral }}>{fmt(ingOnly * 3)}</td>
                                    <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 13, color: BRAND.coral }}>{fmt(ingOnly * 4)}</td>
                                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                                      <input type="number" step="0.01" placeholder="—" value={opt.yourPrice} onChange={(e) => updateSellingOption(recipe.id, idx, "yourPrice", e.target.value)} style={{ ...smallInputStyle, width: 65, fontWeight: 700, color: BRAND.green }} />
                                    </td>
                                    <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 13, color: hourlyEarned >= 20 ? BRAND.green : hourlyEarned > 0 ? BRAND.coral : BRAND.muted, fontWeight: 600 }}>
                                      {price > 0 ? `${fmt(hourlyEarned)}/hr` : "—"}
                                    </td>
                                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                      <button onClick={() => removeSellingOption(recipe.id, idx)} style={{ background: "none", border: "none", color: BRAND.coral, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <button onClick={() => addSellingOption(recipe.id)} style={{ background: "none", border: `1px dashed ${BRAND.border}`, borderRadius: 6, padding: "8px 16px", color: BRAND.green, cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif", marginTop: 8, width: "100%" }}>
                          + Add Selling Option
                        </button>
                      </div>

                      <button onClick={() => removeRecipe(recipe.id)} style={{ background: "none", border: "none", color: BRAND.coral, cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif", marginTop: 12, padding: "4px 0" }}>
                        Delete this product
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <button onClick={addRecipe} style={{ background: BRAND.green, color: BRAND.cream, border: "none", borderRadius: 8, padding: "14px 24px", fontSize: 15, fontFamily: "'Georgia', serif", cursor: "pointer", width: "100%", fontWeight: 600 }}>
              + Add New Product
            </button>
          </div>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === "ingredients" && (
          <div>
            <p style={{ fontSize: 14, color: BRAND.muted, fontStyle: "italic", marginBottom: 16 }}>
              Enter your shelf prices and package sizes. Costs flow through to all recipes automatically.
              {includeTax && <span style={{ color: BRAND.coral }}> ({taxRate}% local tax applied to costs.)</span>}
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: BRAND.white, borderRadius: 8, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: BRAND.green }}>
                    {["Ingredient", "Price", "Pkg Size", "Unit", "Cost/Unit", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 10px", color: BRAND.white, fontWeight: 600, fontSize: 12, textAlign: h === "Ingredient" ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing, idx) => (
                    <tr key={ing.id} style={{ borderBottom: `1px solid ${BRAND.border}`, background: idx % 2 === 0 ? BRAND.white : BRAND.cream }}>
                      <td style={{ padding: "8px 10px" }}>
                        <input value={ing.name} onChange={(e) => updateIngredient(ing.id, "name", e.target.value)} style={{ ...inputStyle, background: "transparent", border: "none", padding: "2px 0" }} />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right" }}>
                        <input type="number" step="0.01" value={ing.price} onChange={(e) => updateIngredient(ing.id, "price", e.target.value)} style={{ ...smallInputStyle, background: "transparent", width: 70 }} />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right" }}>
                        <input type="number" step="any" value={ing.size} onChange={(e) => updateIngredient(ing.id, "size", e.target.value)} style={{ ...smallInputStyle, background: "transparent", width: 60 }} />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right" }}>
                        <input value={ing.unit} onChange={(e) => updateIngredient(ing.id, "unit", e.target.value)} style={{ ...smallInputStyle, background: "transparent", width: 50 }} />
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: BRAND.green }}>
                        {fmt(costPerPurchaseUnit(ing))}/{ing.unit}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <button onClick={() => removeIngredient(ing.id)} style={{ background: "none", border: "none", color: BRAND.coral, cursor: "pointer", fontSize: 16 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input placeholder="New ingredient name" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIngredient()} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addIngredient} style={{ background: BRAND.green, color: BRAND.cream, border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 14, fontFamily: "'Georgia', serif", cursor: "pointer" }}>Add</button>
            </div>
          </div>
        )}

        {/* PRICE LIST TAB */}
        {activeTab === "pricelist" && (
          <div>
            <p style={{ fontSize: 14, color: BRAND.muted, fontStyle: "italic", marginBottom: 16 }}>Your at-a-glance pricing reference. Costs pull from Recipe Costing.</p>
            <div style={{ background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: BRAND.green }}>
                    {["Product", "Option", "Ing. Cost", "Your Price", "Markup", "Hourly"].map((h) => (
                      <th key={h} style={{ padding: "12px 10px", color: BRAND.white, fontWeight: 600, fontSize: 12, textAlign: h === "Product" || h === "Option" ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recipes.flatMap((r) =>
                    (r.sellingOptions || []).map((opt, idx) => {
                      const ingOnly = sellingOptionIngCost(r, opt);
                      const price = parseFloat(opt.yourPrice) || 0;
                      const ingForQty = recipeIngCostPerUnit(r) * opt.qty;
                      const overheadForQty = r.overheadCost * opt.qty;
                      const hourlyEarned = price > 0 && r.laborHours > 0
                        ? ((price - ingForQty - opt.packagingCost - overheadForQty) / r.laborHours) * (r.batchYield / opt.qty)
                        : 0;
                      const markup = ingOnly > 0 && price > 0 ? (price / ingOnly).toFixed(1) : "—";
                      return (
                        <tr key={`${r.id}-${idx}`} style={{ borderBottom: `1px solid ${BRAND.border}`, background: idx % 2 === 0 ? BRAND.white : BRAND.cream }}>
                          <td style={{ padding: "12px 10px", fontWeight: 600 }}>{idx === 0 ? r.name : ""}</td>
                          <td style={{ padding: "12px 10px", color: BRAND.muted }}>{opt.name} ({opt.qty})</td>
                          <td style={{ padding: "12px 10px", textAlign: "right", color: BRAND.muted }}>{fmt(ingOnly)}</td>
                          <td style={{ padding: "12px 10px", textAlign: "right" }}>
                            <input type="number" step="0.01" placeholder="—" value={opt.yourPrice} onChange={(e) => updateSellingOption(r.id, idx, "yourPrice", e.target.value)} style={{ ...smallInputStyle, fontWeight: 700, color: BRAND.green, width: 75 }} />
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right", color: BRAND.muted }}>{markup !== "—" ? `${markup}x` : "—"}</td>
                          <td style={{ padding: "12px 10px", textAlign: "right", fontSize: 13, color: hourlyEarned >= 20 ? BRAND.green : hourlyEarned > 0 ? BRAND.coral : BRAND.muted, fontWeight: 600 }}>
                            {price > 0 ? `${fmt(hourlyEarned)}/hr` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 20, padding: 16, background: BRAND.greenLight, borderRadius: 8, fontSize: 13, color: BRAND.green, fontStyle: "italic", lineHeight: 1.5 }}>
              Rule of thumb: price at 3–4× your ingredient cost (including packaging). That markup is meant to cover ingredients, your time, overhead, and profit all in one. The &ldquo;Hourly&rdquo; column shows what you&rsquo;re actually paying yourself at your chosen price — green means $20+/hr, coral means below that.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
