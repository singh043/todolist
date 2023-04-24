const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://dbuser3a:WiuZTW3H2ZdP2n4v@cluster0.ganajb5.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your Todo List"
});

const item2 = new Item({
  name: "Hit the + to add a new task"
});

const item3 = new Item({
  name: "Click the checkbox to delete a task"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res){
  Item.find({}).then(foundItems => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved default data to Database");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }   
  });
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name:customListName}).then(foundList=>{
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/"+customListName);
    }else{
      res.render("list",{listTitle: foundList.name,newListItems: foundList.items})
    }  
  });
})

app.post("/",function(req,res) {
  
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}).then(foundList=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
})

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(items=>{
    console.log("Successfully deleted tasks from Database")
    });
    res.redirect("/")
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedItemId}}})
    .then(foundList=>res.redirect("/"+listName))
  }
})

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
