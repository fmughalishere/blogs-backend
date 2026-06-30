import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Blog from "../models/Blog";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// GET /api/blogs?page=&limit=&category=&search=   (public — published only)
export const getPublicBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(parseInt((req.query.limit as string) || "9"), 50);
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: Record<string, unknown> = { status: "published" };
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// GET /api/blogs/:id   (public — id is _id or slug, published only, increments views)
export const getPublicBlogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id, status: "published" }
    : { slug: id, status: "published" };

  const blog = await Blog.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true }).populate(
    "author",
    "name"
  );

  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ blog });
});

// ── Admin ──────────────────────────────────────────────────────

// GET /api/admin/blogs?page=&limit=&status=&search=   (admin — any status)
export const getAdminBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 100);
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (search) filter.title = { $regex: search, $options: "i" };

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// GET /api/admin/blogs/:id   (admin — fetch for editing, no view increment)
export const getAdminBlogById = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findById(req.params.id).populate("author", "name");
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ blog });
});

// POST /api/admin/blogs   (admin)
export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const { title, excerpt, content, coverImage, category, tags, status } = req.body;

  if (!title || !excerpt || !content) {
    res.status(400).json({ error: "Title, excerpt and content are required" });
    return;
  }

  let slug = slugify(title);
  const existing = await Blog.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;

  const blog = await Blog.create({
    title,
    slug,
    excerpt,
    content,
    coverImage,
    category,
    tags,
    status: status || "published",
    author: req.user!.id,
  });

  res.status(201).json({ message: "Blog created", blog });
});

// PUT /api/admin/blogs/:id   (admin)
export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ message: "Blog updated", blog });
});

// DELETE /api/admin/blogs/:id   (admin)
export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ message: "Blog deleted" });
});
