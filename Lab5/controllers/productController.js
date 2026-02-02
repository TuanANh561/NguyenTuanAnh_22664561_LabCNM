const { randomUUID } = require("crypto");

const docClient = require("../config/dynamodb");
const { PutCommand, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.DYNAMODB_TABLE;

exports.getAllProducts = async (req, res) => {
  const data = await docClient.send(new ScanCommand({ TableName: TABLE }));
  res.render("products/index", { products: data.Items || [] });
};

exports.showAddForm = (req, res) => res.render("products/add");

exports.addProduct = async (req, res) => {
  const { name, price, quantity } = req.body;
  const imageUrl = "/uploads/" + req.file.filename;

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: {
      id: randomUUID(),
      name,
      price: Number(price),
      quantity: Number(quantity),
      url_image: imageUrl
    }
  }));

  res.redirect("/");
};

exports.showEditForm = async (req, res) => {
  const data = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { id: req.params.id }
  }));
  res.render("products/edit", { product: data.Item });
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, price, quantity, url_image_old } = req.body;

    const imagePath = req.file ? "/uploads/" + req.file.filename : url_image_old;

    const params = {
      TableName: TABLE,
      Key: { id: req.params.id },
      UpdateExpression: "SET #n = :n, price = :p, quantity = :q, url_image = :u",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: {
        ":n": name,
        ":p": Number(price),
        ":q": Number(quantity),
        ":u": imagePath
      }
    };

    await docClient.send(new UpdateCommand(params));
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Lỗi update");
  }
};

exports.deleteProduct = async (req, res) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { id: req.params.id }
  }));
  res.redirect("/");
};