const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Recipe = require('../../models/Recipe');
const Chat = require('../../models/Chat');

// Apply authentication middleware to all routes
router.use(ensureAuth);

// Get user profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-googleId');
    const recipeCount = await Recipe.countDocuments({ user: req.user.id });
    const chatCount = await Chat.countDocuments({ user: req.user.id });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        recipeCount,
        chatCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/', async (req, res) => {
  try {
    const { displayName, firstName, lastName } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, firstName, lastName },
      { new: true, runValidators: true }
    ).select('-googleId');
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Delete user account
router.delete('/', async (req, res) => {
  try {
    // Delete user's recipes
    await Recipe.deleteMany({ user: req.user.id });
    
    // Delete user's chat history
    await Chat.deleteMany({ user: req.user.id });
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    
    req.logout(() => {
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: error.message
    });
  }
});

module.exports = router;