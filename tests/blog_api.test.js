const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')


const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.blogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }

  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({username: 'root', passwordHash})

  await user.save()
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(helper.blogs.length)
})

test('blog has unique identifier id', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body[0].id).toBeDefined();
})

test('a new blog without token returns 401', async () => {
  const newBlog = {
    title: 'new blog for testing',
    author: 'julia shi',
    url: 'juliashi.com',
    likes: 100
  }
  await api
  .post('/api/blogs')
  .send(newBlog)
  .expect(401)
})

test('a valid blog can be added', async () => {
  const login = await api.post('/api/login').send({"username": "root", "password":"sekret"})
  const token = login.body.token

  const newBlog = {
    title: 'new blog for testing',
    author: 'julia shi',
    url: 'juliashi.com',
    likes: 100
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `bearer ${token}` })
    .expect(201)
    .expect('Content-Type', /application\/json/)
  let blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.blogs.length + 1)

  const titles = blogsAtEnd.map(r => r.title)
  expect(titles).toContain('new blog for testing')
})

test('blog without likes, likes is zero', async () => {
  const login = await api.post('/api/login').send({"username": "root", "password":"sekret"})
  const token = login.body.token

  const newBlog = {
    title: 'new blog without likes',
    author: 'julia shi',
    url: 'juliashi.com'  
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `bearer ${token}` })
    .expect(201)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBe(0)
})

test('blog with missing content will not be saved', async () =>{
  const login = await api.post('/api/login').send({"username": "root", "password":"sekret"})
  const token = login.body.token

  const newBlog = {
    author: 'julia shi'
  }

  await api.post('/api/blogs').send(newBlog).set({ Authorization: `bearer ${token}` }).expect(400)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.blogs.length)
})

test('delete a single blog post', async () => {

  const blogs = await helper.blogsInDb()
  const id = blogs[0].id;

  await api.delete(`/api/blogs/${id}`).expect(204)
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.blogs.length - 1)
})

test('updating likes for a post', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const originalBlog = blogsAtStart[0]
  const likes = originalBlog.likes + 100
  const newBlog = {title: originalBlog.title, author: originalBlog.author, url: originalBlog.url, likes}
  console.log(`api/blogs/${originalBlog.id}`)
  await api.put(`/api/blogs/${originalBlog.id}`).send(newBlog).expect(200)

  const blog = await Blog.findById(originalBlog.id)
  expect(blog.likes).toBe(likes)
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {

  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('create user with no password returns 400 statuscode', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'julia',
      name: 'Julia Shi',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })


})

afterAll(() => {
  mongoose.connection.close()
})