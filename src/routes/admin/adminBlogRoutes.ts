import { Router } from "express";
import {
  getAdminBlogs,
  getAdminBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../controllers/blogController";
import { protect, adminOnly } from "../../middleware/auth";

const router = Router();

router.use(protect, adminOnly);

router.get("/", getAdminBlogs);
router.post("/", createBlog);
router.get("/:id", getAdminBlogById);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
