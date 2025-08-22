import { model, Schema, Document, Types } from "mongoose";

export interface IMultimedia {
  issueID: Types.ObjectId;
  fileType: "image" | "video";
  url: string;
  filename: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MultimediaSchema = new Schema<IMultimedia & Document>(
  {
    issueID: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    fileType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export interface MultimediaDocument extends IMultimedia, Document {}
export const MultimediaModel = model<MultimediaDocument>("Multimedia", MultimediaSchema);