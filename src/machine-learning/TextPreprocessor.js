class TextPreprocessor {
  constructor() {}

  static preprocess(text) {
    text = text.toLowerCase();
    text = text.split(" ");
    //return ["hi", "this", "is", "for", "just", "testing", "purpose", "happy"];
    return text;
  }
}
