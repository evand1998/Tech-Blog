const router = require('express').Router();
const { User, Post, Comment } = require('../../models');
const withAuth = require('../../utils/auth');

// GET ALL users
router.get('/', (req, res) => {
    // Access our User Model and run .findAll() method
    User.findAll({
        attributes: { exclude: ['password'] }
    })
        .then(dbUserData => res.json(dbUserData))
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// GET User by ID
router.get('/:id', (req, res) => {
    User.findOne({
        attributes: { exclude: ['password'] },
        where: {
            id: req.params.id
        },
        include: [
            {
                model: Post,
                attributes: ['id', 'title', 'post_text', 'created_at']
            },
            {
                model: Comment,
                attributes: ['id', 'comment_text', 'created_at']
            }
        ]
    })
    .then(dbUserData => {
        if (!dbUserData) {
            res.status(404).json({ message: 'No User found with this ID'});
            return;
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

// POST/CREATE a New User
router.post('/', (req, res) => {
    User.create({
      username: req.body.username,
      password: req.body.password
    })
    .then(dbUserData => {
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.loggedIn = true;
  
        res.json(dbUserData)
      })
    })    
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
  });

// Login Route
router.post('/login', (req, res) => {
    User.findOne({
      where: {
        username: req.body.username
      }
    })
    .then(dbUserData => {
      //verify user
      if(!dbUserData) {
        res.status(400).json({ message: 'Username not Found' });
        return;
      }
      const validPassword = dbUserData.checkPassword(req.body.password);
      if (!validPassword) {
        res.status(400).json({ message: 'Incorrect Password' });
        return;
      }
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.loggedIn = true;
        res.json({user: dbUserData, message: 'You are now logged in!' });
      });
    });
  });

// Logout route
router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
      req.session.destroy(() => {
        res.status(204).end();
      })
    } else {
      res.status(404).end();
    }
  });

// PUT/UPDATE a User by ID
router.put('/:id', (req, res) => {
    User.update(req.body, {
        individualHooks: true,
        where: {
            id: req.params.id
        }
    })
    .then(dbUserData => {
        if (!dbUserData[0]) {
            res.status(404).json({ message: 'No User found with this ID' });
            return;
        }
        res.json(dbUserData);
    })
    .catch(err => {
        res.status(500).json(err);
    })
});

// DELETE a User by ID
router.delete('/:id', (req, res) => {
    User.destroy({
        where: {
            id: req.params.id
        }
    })
    .then(dbUserData => {
        if (!dbUserData) {
            res.status(404).json({ message: 'No User found with this ID' });
            return;
        }
        res.json(dbUserData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

module.exports = router;