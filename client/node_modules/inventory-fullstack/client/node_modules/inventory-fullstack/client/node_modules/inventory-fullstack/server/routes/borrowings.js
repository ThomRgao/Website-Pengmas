const express = require("express");
const router = express.Router();

let db = require("../db/index");

function nextId(col) {
  const last = col.at(-1);
  return last ? last.id + 1 : 1;
}

router.get("/", (req, res) => {
  const { status } = req.query;
  let rows = db.borrowings;
  if (status) rows = rows.filter(b => b.status === status);
  res.json(rows);
});

router.post("/", (req, res) => {
  const { itemId, quantity, expectedReturn, notes } = req.body;
  const item = db.items.find(i => String(i.id) === String(itemId));
  if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });
  const user = req.user || { id: "u", fullName: "User" };
  const row = {
    id: nextId(db.borrowings),
    itemId: item.id,
    itemName: item.name,
    quantity: Number(quantity || 1),
    userId: user.id,
    userName: user.fullName || user.name || "User",
    expectedReturn: expectedReturn || "",
    notes: notes || "",
    status: "pending",
    date: new Date().toISOString().slice(0, 19).replace("T", " ")
  };
  db.borrowings.push(row);
  res.json(row);
});

router.patch("/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  const b = db.borrowings.find(x => x.id === id);
  if (!b) return res.status(404).json({ error: "Pengajuan tidak ditemukan" });
  if (b.status !== "pending") return res.status(400).json({ error: "Status tidak valid" });
  const item = db.items.find(i => i.id === b.itemId);
  if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });
  if (item.stock < b.quantity) return res.status(400).json({ error: "Stok tidak mencukupi" });
  item.stock -= b.quantity;
  b.status = "borrowed";
  const trans = {
    id: nextId(db.transactions),
    type: "out",
    itemId: item.id,
    itemName: item.name,
    quantity: b.quantity,
    userId: b.userId,
    userName: b.userName,
    notes: b.notes || "Borrow approved",
    date: new Date().toISOString().slice(0, 19).replace("T", " ")
  };
  db.transactions.unshift(trans);
  res.json({ borrowing: b, item, transaction: trans });
});

router.patch("/:id/reject", (req, res) => {
  const id = Number(req.params.id);
  const b = db.borrowings.find(x => x.id === id);
  if (!b) return res.status(404).json({ error: "Pengajuan tidak ditemukan" });
  if (b.status !== "pending") return res.status(400).json({ error: "Status tidak valid" });
  b.status = "rejected";
  res.json(b);
});

router.post("/:id/return", (req, res) => {
  const id = Number(req.params.id);
  const b = db.borrowings.find(x => x.id === id);
  if (!b) return res.status(404).json({ error: "Data tidak ditemukan" });
  if (b.status !== "borrowed") return res.status(400).json({ error: "Status tidak valid" });
  const item = db.items.find(i => i.id === b.itemId);
  if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });
  item.stock += b.quantity;
  b.status = "returned";
  const trans = {
    id: nextId(db.transactions),
    type: "in",
    itemId: item.id,
    itemName: item.name,
    quantity: b.quantity,
    userId: b.userId,
    userName: b.userName,
    notes: "Return",
    date: new Date().toISOString().slice(0, 19).replace("T", " ")
  };
  db.transactions.unshift(trans);
  res.json({ borrowing: b, item, transaction: trans });
});

module.exports = router;
