const _ = require('lodash') 

const dummy = (blogs) => {
  return 1;
}

const totalLikes = (blogs) => {
  if (blogs.length === 0) { 
    return 0 
  }
  let total = blogs.reduce((sum, blog) => {
    return blog.likes + sum
  }, 0)
  return total;
}

const favoriteBlog = (blogs) => {
  let max;
  blogs.forEach(blog => {
    if ( !max || blog.likes > max.likes ) {
      max = blog;
    }
  })
  return max;
}

const mostBlogs = (blogs) => {
  let count = _.countBy(blogs, 'author')
  let max;
  Object.keys(count).forEach(key => {
    if (!max || count[key] > count[max]) {
      max = key;
    }
  })
  let most = {};
  most.author = max;
  most.blogs = count[max]

  return most;
}

const mostLikes = (blogs) => {
  let count = _.groupBy(blogs, 'author')
  let likes = _.mapValues(count, value => value.reduce((sum, blog) => blog.likes + sum, 0))
  let max;
  Object.keys(likes).forEach(key => {
    if (!max || likes[key] > likes[max]) {
      max = key;
    }
  })
  let most = {};
  most.author = max;
  most.likes = likes[max]
  return most;
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}