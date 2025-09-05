---
layout: page
title: All Posts
permalink: /posts/
---

# 📚 All Posts

Here’s a list of everything I’ve written so far:

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>  
      <small>— {{ post.date | date: "%b %d, %Y" }}</small>
    </li>
  {% endfor %}
</ul>
