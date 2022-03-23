const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { userExtractor } = require('../utils/middleware')


blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', {username: 1, name: 1})
  return response.json(blogs)
})

blogRouter.post('/', userExtractor, async (request, response) => {
  const user = request.user
  const body = request.body
  
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id,
  })

  if (!blog.likes) {
    blog.likes = 0
  }

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  const blog = await Blog.findById(request.params.id)
  console.log(blog)
  if (decodedToken.id.toString() !== blog.user.toString()) {
    return response.status(401).json({error: 'only creator can delete the blog'})
  }

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
  const {title, author, url, likes} = request.body
  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id, 
    {title, author, url, likes}, 
    {new: true, runValidators: true, context: 'query'})
  return response.json(updatedBlog)
})

blogRouter.post('/:id/comments', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  console.log(blog)
  if (blog) {
    const comment = request.body.comment
    const newBlog = {
      title: blog.title,
      author: blog.author,
      url: blog.url,
      likes: blog.likes,
      comments: blog.comments.concat(comment)
    }
    console.log(newBlog)
    const updateBlog = await Blog.findByIdAndUpdate(
      request.params.id, newBlog, { new:true }
    )
    return response.json(updateBlog)
  }

  return response.status(404).end()
})

module.exports = blogRouter