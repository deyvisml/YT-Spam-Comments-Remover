const stemmer = LANG == "en" ? new PorterStemmerEN() : new PorterStemmerES();
const stopwords = LANG == "en" ? stopwords_en : stopwords_es;

class TextPreprocessor {
  constructor() {}
  // cleaner
  cleaner = (text) => {
    // text to lower case
    let lowercase_text = text.toLowerCase();

    // (only for tweater dataset) remove old style retweet text "RT"
    lowercase_text = lowercase_text.replace(/^rt\s+/, "");

    // remove @ mentions
    lowercase_text = lowercase_text.replace(/@\w+/g, "");

    // remove <br> strings
    lowercase_text = lowercase_text.replace(/<br>/g, "");

    // remove &quot;
    lowercase_text = lowercase_text.replace(/&quot;/g, "");

    // remove URLs
    lowercase_text = lowercase_text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");

    // remove punctuations signs
    let cleaned_text = lowercase_text.replace(/[,.'¡!¿?#’]/g, "");
    //let cleaned_text = lowercase_text.replace(/[^\w\s]|_/g, ""); // wrong !!

    // remove numbers
    cleaned_text = cleaned_text.replace(/[0-9]/g, "");

    // replace a secuence of whitespaces with one whitespace
    cleaned_text = cleaned_text.replace(/\s+/g, " ");

    // remove the whitespaces in the begin and end
    cleaned_text = cleaned_text.trim();

    return cleaned_text;
  };

  tokenizer = (text) => {
    const words = text.split(/\s+/); // it's not necesary to use the g flag in this method

    return words;
  };

  stopWordsRemover = (tokens) => {
    const cleaned_tokens = [];
    for (const token of tokens) {
      if (stopwords.indexOf(token) === -1) {
        cleaned_tokens.push(token);
      }
    }

    return cleaned_tokens;
  };

  stemmer = (tokens) => {
    const stemmed_tokens = [];

    for (let token of tokens) {
      // ref: https://github.com/NaturalNode/natural/blob/c2389f2a17faae9582a1a0f41402c68407ccb378/lib/natural/stemmers/stemmer_es.js#L41C13-L41C13
      if (token.match(/[a-záéíóúüñ0-9]+/gi)) {
        token = stemmer.stem(token);
      }

      stemmed_tokens.push(token);
    }

    return stemmed_tokens;
  };

  preprocess = (text) => {
    // clean
    const cleaned_text = this.cleaner(text);

    // tokenize
    const tokens = this.tokenizer(cleaned_text);

    // remove stop words
    const cleaned_tokens = this.stopWordsRemover(tokens);

    // stemming
    const stemmed_tokens = this.stemmer(cleaned_tokens);

    return stemmed_tokens;
  };
}

const text_preprocessor = new TextPreprocessor();
