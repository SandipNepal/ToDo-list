require("dotenv").config();

const express = require("express");

const bodyParser = require("body-parser");

const date = require(__dirname + "/date.js");

const _ = require("lodash");

const app = express();

const mongoose = require("mongoose");

app.use(bodyParser.urlencoded({
  extended: true
}));

const today = date.getDate();

mongoose.connect(process.env.DB_URL || "mongodb://localhost:27017/todolistDB", {
  useNewUrlParser:true,
  useUnifiedTopology:true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Click the + button to add a new item"
});

const item3 = new Item({
  name: "← Check the box, to clear a list"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.use(express.static("public"));

app.set("view engine", "ejs");


app.get("/", function(req, res) {

  Item.find({}, function(err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err)
          console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: results
      });
    }
  });

  let day = date.getDate(); //using date which is required to call getDate or getDay function

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundResults) {
    if (!err) {
      if (!foundResults) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundResults.name,
          newListItems: foundResults.items
        });
      }
    }
  });
});


app.get("/about", function(req, res) {
  res.render("about");
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const a = listName.slice(0,3);
  const b = today.slice(0, 3);

  //creating a new model for user's workItems
  const item = new Item({
    name: itemName
  });

  if (a === b) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName =  req.body.listName;

  const a = listName.slice(0,3);
  const b = today.slice(0, 3);
  if(a === b) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err)
        console.log(err);
      else
        console.log("successfully deleted");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      {name : listName},
      {$pull: {items : {_id : checkedItemId}}},
      function(err, foundList){
        if(!err) {
          res.redirect("/" + listName);
        }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("server started");
});
