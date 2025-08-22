// backend/src/controllers/issue.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { IssueModel } from "../models/issue.model";
import { MultimediaModel } from "../models/multimedia.model";

/**
 * Lightweight interfaces for the documents we use in this controller.
 * Adapt these if your Mongoose models export their own TypeScript types.
 */
interface MultimediaDoc {
  _id: mongoose.Types.ObjectId;
  issueID: mongoose.Types.ObjectId;
  fileType: "image" | "video" | string;
  url: string;
  filename: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IssueDoc {
  _id: mongoose.Types.ObjectId;
  citizenId?: mongoose.Types.ObjectId | string;
  issueType: string;
  title: string;
  description: string;
  location: any;
  status: string;
  media?: mongoose.Types.ObjectId[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new issue, optionally storing uploaded media entries.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    // multer files (may be undefined)
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const { title, description, location, issueType } = req.body;

    // Parse location if provided as JSON string
    let parsedLocation: any = location;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        res.status(400).json({ message: "Invalid location JSON format" });
        return;
      }
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !parsedLocation ||
      !parsedLocation.latitude ||
      !parsedLocation.longitude ||
      !parsedLocation.address ||
      !issueType
    ) {
      res.status(400).json({ message: "Please fill all the required fields" });
      return;
    }

    // Prevent duplicate title
    const existingIssue = await IssueModel.findOne({ title }).exec();
    if (existingIssue) {
      res.status(400).json({ message: "Issue with this title already exists" });
      return;
    }

    // Create the issue (cast to IssueDoc for typing)
    const created = await IssueModel.create({
      citizenId: (req as any).citizenId,
      issueType,
      title,
      description,
      location: parsedLocation,
      status: "Reported",
      media: [],
    });

    const issue = created as unknown as IssueDoc;

    // If there are uploaded files, create multimedia docs
    let mediaDocs: MultimediaDoc[] = [];

    if (files.length > 0) {
      // map and create each media entry, awaiting them in parallel
      const createdMedia = await Promise.all(
        files.map(async (file) => {
          const md = await MultimediaModel.create({
            issueID: issue._id,
            fileType: file.mimetype.startsWith("video") ? "video" : "image",
            url: file.path,
            filename: file.originalname,
          });
          // Cast to MultimediaDoc
          return md as unknown as MultimediaDoc;
        })
      );

      mediaDocs = createdMedia;

      // Update issue with references to media object ids
      const mediaIds = mediaDocs.map((d) => d._id);
      await IssueModel.findByIdAndUpdate(issue._id, { media: mediaIds }).exec();
    }

    res.status(201).json({
      message: "Issue created successfully",
      issue,
      media: mediaDocs,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetch all issues (simple projection + media thumbnail selection)
 */
export const getIssues = async (req: Request, res: Response) => {
  try {
    // Use .lean() so we get plain objects (faster and easier to type as any[])
    const issues = (await IssueModel.find({})
      .populate("citizenId", "fullName")
      .populate("media")
      .lean()) as any[];

    // Build presentation objects
    const issuesWithMedia = issues.map((issue) => {
      // media may be an array of docs when populated
      const mediaArr = Array.isArray(issue.media) ? issue.media : [];
      const firstMedia = mediaArr.length > 0 ? mediaArr[0] : null;

      return {
        _id: issue._id,
        title: issue.title,
        description: issue.description,
        type: issue.issueType,
        location: issue.location,
        reportedBy: (issue.citizenId as any)?.fullName || "Anonymous",
        reportedAt: issue.createdAt,
        image: firstMedia ? (firstMedia as any).url : null,
        status: issue.status,
      };
    });

    res.json({ issues: issuesWithMedia });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
