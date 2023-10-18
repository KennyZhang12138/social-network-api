const { Thought, User } = require("../models");

module.exports = {
  // GET /api/users
  async getUsers(req, res) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      console.error({ message: err });
      return res.status(500).json(err);
    }
  },

  // GET /api/users/:id
  async getSingleUser(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id })
        .populate({ path: "thoughts", select: "-__v" })
        // populate user friends
        .populate({ path: "friends", select: "-__v" })
        .select("-__v");
      !user
        ? res.status(404).json({ message: "No user with that ID" })
        : res.json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // POST /api/users
  async createUser(req, res) {
    try {
      const user = await User.create(req.body);
      res.json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // PUT /api/users/:id
  async updateUser(req, res) {
    try {
      const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { runValidators: true, new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "No user with this id!" });
      }
      res.json(user);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  // DELETE /api/users/:id
  async deleteUser(req, res) {
    try {
      const user = await User.findOneAndDelete({
        _id: req.params.id,
      });
      if (!user) {
        return res.status(404).json({ message: "No user with that ID" });
      }
      await User.updateMany(
        { _id: { $in: user.friends } },
        { $pull: { friends: req.params.id } }
      );
      await Thought.deleteMany({ _id: { $in: user.thoughts } });
      res.json({ message: "User and associated thoughts deleted!" });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  // POST /api/users/:userId/friends/:friendId
  async addFriend(req, res) {
    try {
      const user1 = await User.findOneAndUpdate(
        { _id: req.params.userId },
        { $addToSet: { friends: req.params.friendId } },
        { new: true, runValidators: true }
      );
      if (!user1) {
        return res.status(404).json({ message: "No user with that ID" });
      }
      const user2 = await User.findOneAndUpdate(
        { _id: req.params.friendId },
        { $addToSet: { friends: req.params.userId } },
        { new: true, runValidators: true }
      );
      if (!user2) {
        return res.status(404).json({ message: "No user with that ID" });
      }
      res.json(user1);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  async deleteFriend(req, res){
    try{
      const user1 = await User.findOneAndUpdate(
        { _id: req.params.userId },
        { $pull: { friends: req.params.friendId } },
        { new: true, runValidators: true }
      );
      if (!user1) {
        return res.status(404).json({ message: "No user with that ID" });
      }
      const user2 = await User.findOneAndUpdate(
        { _id: req.params.friendId },
        { $pull: { friends: req.params.userId } },
        { new: true, runValidators: true }
      );
      if (!user2) {
        return res.status(404).json({ message: "No user with that ID" });
      }
      res.json({ message: "Successfully deleted the friend" });
    }catch(err){
      console.log(err);
      res.status(500).json(err);
    }
  }
};
