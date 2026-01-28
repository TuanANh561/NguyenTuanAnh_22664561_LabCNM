const { randomUUID } = require("crypto");
const docClient = require("../config/dynamodb");
const { PutCommand, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const s3 = require("../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const TABLE = process.env.DYNAMODB_TABLE;

// helper upload ảnh
const uploadToS3 = async (file) => {
  if (!file) return null;

  const fileName = Date.now() + "-" + file.originalname;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

const handleError = (res, err, msg) => {
  console.error(err);
  res.send(msg);
};

exports.getAllProducts = async (req, res) => {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: TABLE }));
    res.render("products/index", { products: data.Items || [] });
  } catch (err) {
    handleError(res, err, "Lỗi khi lấy sản phẩm");
  }
};

exports.showAddForm = (req, res) => res.render("products/add");

exports.addProduct = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const imageUrl = await uploadToS3(req.file);

    if (!imageUrl) return res.send("Chưa chọn ảnh");

    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: {
        ma_sp: randomUUID(),
        name,
        price: Number(price),
        quantity: Number(quantity),
        url_image: imageUrl
      }
    }));

    res.redirect("/");
  } catch (err) {
    handleError(res, err, "Lỗi upload sản phẩm");
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const data = await docClient.send(new GetCommand({
      TableName: TABLE,
      Key: { ma_sp: req.params.id }
    }));

    res.render("products/edit", { product: data.Item });
  } catch (err) {
    handleError(res, err, "Lỗi khi lấy sản phẩm");
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, price, quantity, url_image } = req.body;
    const newImageUrl = await uploadToS3(req.file);
    const finalImageUrl = newImageUrl || url_image;

    await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { ma_sp: req.params.id },
      UpdateExpression: "set #n = :name, price = :price, quantity = :quantity, url_image = :url",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: {
        ":name": name,
        ":price": Number(price),
        ":quantity": Number(quantity),
        ":url": finalImageUrl,
      },
    }));

    res.redirect("/");
  } catch (err) {
    handleError(res, err, "Lỗi cập nhật");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE,
      Key: { ma_sp: req.params.id }
    }));

    res.redirect("/");
  } catch (err) {
    handleError(res, err, "Lỗi khi xóa sản phẩm");
  }
};