import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentsModel from "../models/comments_model";
import { Express } from "express";
import testComments from "./test_comments.json";
import userModel, { IUser } from "../models/users_model";

var app: Express;

type User = IUser & { token?: string };
const testUser: User = {
    email: "test@user.com",
    password: "testpassword",
  };

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await commentsModel.deleteMany();
  await userModel.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const res = await request(app).post("/auth/login").send(testUser);
  testUser.token = res.body.accessToken;
  testUser._id = res.body._id;
  expect(testUser.token).toBeDefined();

  const res_create_post = await request(app)
    .post("/posts")
    .set({ authorization: "JWT " + testUser.token })
    .send({
      title: "Test Post",
      content: "Test Content",
      owner: testUser._id,
    });
  const postId = res_create_post.body._id;
  console.log("Post created with ID:", postId);
  testComments[0].postId = postId;
  testComments[0].owner = "" + testUser._id;
  console.log("Test Comments:", testComments);
});


afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let commentId = "";

describe("Comments Tests", () => {
  test("Comments test get all", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Comment", async () => {
    const response = await request(app).post("/comments")
      .set({ authorization: "JWT " + testUser.token })
      .send(testComments[0]);
    expect(response.statusCode).toBe(201);
    expect(response.body.comment).toBe(testComments[0].comment);
    expect(response.body.postId).toBe(testComments[0].postId);
    expect(response.body.owner).toBe(testComments[0].owner);
    commentId = response.body._id;
  });

  test("Test get commenty by owner", async () => {
    const response = await request(app).get("/comments?owner=" + testComments[0].owner);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].comment).toBe(testComments[0].comment);
    expect(response.body[0].postId).toBe(testComments[0].postId);
    expect(response.body[0].owner).toBe(testComments[0].owner);
  });

  test("Comments get post by id", async () => {
    const response = await request(app).get("/comments/" + commentId);
    expect(response.statusCode).toBe(200);
    expect(response.body.comment).toBe(testComments[0].comment);
    expect(response.body.postId).toBe(testComments[0].postId);
    expect(response.body.owner).toBe(testComments[0].owner);
  });

});