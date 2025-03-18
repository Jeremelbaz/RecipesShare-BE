import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import { Express } from "express";
import userModel, { IUser } from "../models/users_model";
import { analyzeRecipeHelper } from "../controllers/analyzer_helper";


var app: Express;

type User = IUser & { token?: string };
const testUser: User = {
    email: "test@user.com",
    password: "testpassword",
  };

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await postModel.deleteMany();
  await userModel.deleteMany();
  await request(app).post("/auth/register").send(testUser);
  const res = await request(app).post("/auth/login").send(testUser);
  testUser.token = res.body.accessToken;
  testUser._id = res.body._id;
  expect(testUser.token).toBeDefined();
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let postId = "";

describe("Posts Tests", () => {
  test("should return 400 if DB_CONNECT is not defined", async () => {
    // Temporarily unset the environment variable
    delete process.env.DB_CONNECT;
    await expect(initApp()).rejects.toEqual("DB_CONNECT is not defined in .env file");
    process.env.DB_CONNECT = "mongodb://localhost:27017/web_class"; 
  });

  test("should handle database connection failure", async () => {
    mongoose.connect = jest.fn().mockRejectedValue(new Error("Failed to connect"));
    await expect(initApp()).rejects.toThrow("Failed to connect");
  });

  test("Posts test get all", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Post", async () => {
    const response = await request(app)
      .post("/posts")
      .set({ authorization: "JWT " + testUser.token })
      .send({
        title: "Test Post",
        content: "Test Content",
        owner: "TestOwner",
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    postId = response.body._id;
  });

  test("Test like a post", async () => {
    const response = await request(app)
      .post(`/posts/${postId}/like`)
      .set({ authorization: "JWT " + testUser.token });
  
    expect(response.statusCode).toBe(200);
    expect(response.body.likes).toContain(testUser._id);
  });
  
  test("Test unlike a post (previously liked)", async () => {
    const likeResponse = await request(app)
    .post(`/posts/${postId}/like`)
    .set({ authorization: "JWT " + testUser.token });
  
    expect(likeResponse.statusCode).toBe(200);
    expect(likeResponse.body.likes).toContain(testUser._id);
  
    const unlikeResponse = await request(app)
    .post(`/posts/${postId}/like`)
    .set({ authorization: "JWT " + testUser.token });
  
    expect(unlikeResponse.statusCode).toBe(200);
    expect(unlikeResponse.body.likes).not.toContain(testUser._id);
  });
  
  test("Test like a post with unauthorized user", async () => {
    const unauthorizedUser = { email: "unauthorized@user.com", password: "wrongpassword" };
    await request(app).post("/auth/register").send(unauthorizedUser);
    const unauthorizedResponse = await request(app)
    .post(`/posts/${postId}/like`)
    .set({ authorization: "JWT " + (await request(app).post("/auth/login").send(unauthorizedUser)).body.accessToken });
  
    expect(unauthorizedResponse.statusCode).toBe(401);
  });
  
  test("Test like a non-existent post", async () => {
    const nonExistentPostId = "64cdef123456789012345678";
    const likeResponse = await request(app)
      .post(`/posts/${nonExistentPostId}/like`)
      .set({ authorization: "JWT " + testUser.token });
  
    expect(likeResponse.statusCode).toBe(404);
  });
  test("Test get post by owner", async () => {
    const response = await request(app).get("/posts?owner=" + testUser._id);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Post");
    expect(response.body[0].content).toBe("Test Content");
  });

  test("Test get post by id", async () => {
    const response = await request(app).get("/posts/" + postId);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
  });

  test("Test get post by non-existent ID", async () => {
    const response = await request(app).get("/posts/64cdef123456789012345678");
    expect(response.statusCode).toBe(404);
  });

  test("Test create post with missing fields", async () => {
    const response = await request(app)
      .post("/posts")
      .set({ authorization: "JWT " + testUser.token })
      .send({});
    expect(response.statusCode).toBe(400);
  });

  test("Test analyzeRecipe with valid post ID", async () => {
    // Assuming you have a test post with content
    const postId = "test-post-id"; // Replace with actual test post ID
    const mockPost = { _id: postId, content: "This is a test recipe content..." };
  
    // Mock the model.findById function to return the mock post
    jest.spyOn(postModel, 'findById').mockResolvedValue(mockPost);
  
    const response = await request(app)
      .get(`/posts/${postId}/analyze-recipe`)
      .set({ authorization: "JWT " + testUser.token });
  
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("analysis");
    // You can further test the content of the analysis based on your expectations
  });
 
  test("Test analyzeRecipe with non-existent post ID", async () => {
    const nonExistentPostId = "invalid-post-id";
  
    // Mock the model.findById function to return null
    jest.spyOn(postModel, 'findById').mockResolvedValue(null);
  
    const response = await request(app)
      .get(`/posts/${nonExistentPostId}/analyze-recipe`)
      .set({ authorization: "JWT " + testUser.token });
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });

  test("Test update post with non-existent ID", async () => {
    const response = await request(app)
      .put("/posts/64cdef123456789012345678")
      .set({ authorization: "JWT " + testUser.token })
      .send({ title: "Updated Title" });
    expect(response.statusCode).toBe(404);
  }); 

  test("Test delete post with non-existent ID", async () => {
    const response = await request(app)
      .delete("/posts/64cdef123456789012345678")
      .set({ authorization: "JWT " + testUser.token });
  
    expect(response.statusCode).toBe(404); // Ensure 404 is returned for non-existent posts
  });  

  test("Test delete post", async () => {
    const response = await request(app)
      .delete("/posts/" + postId)
      .set({ authorization: "JWT " + testUser.token });
    expect(response.statusCode).toBe(200);
    const response2 = await request(app).get("/posts/" + postId);
    expect(response2.statusCode).toBe(404);
  });

  test("Test get all posts with large dataset", async () => {
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/posts")
        .set({ authorization: "JWT " + testUser.token })
        .send({ title: `Post ${i}`, content: `Content ${i}`, owner: testUser._id });
    }
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(20);
  });

  test("Test create post with invalid token", async () => {
    const response = await request(app)
      .post("/posts")
      .set({ authorization: "JWT invalidToken" })
      .send({
        title: "Test Post 3",
        content: "Test Content 3",
        owner: testUser._id,
      });
    expect(response.statusCode).toBe(401);
  });

  test("Test get post by owner with no matches", async () => {
    const response = await request(app).get("/posts?owner=nonexistentOwnerId");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test create post with invalid ID", async () => {
    const response = await request(app)
      .post("/posts")
      .set({ authorization: "JWT " + testUser.token })
      .send({ title: "Invalid ID Test", content: "Invalid ID" });
    expect(response.statusCode).toBe(201); // Should pass unless validation fails
  });
});
