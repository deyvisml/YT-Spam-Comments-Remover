class MultinomialNB {
  constructor(model) {
    this.laplace_smoothing = 1; // constant, no change

    if (model) {
      this.frequency = model.frequency;
      this.class_names = model.class_names;
      this.vocabulary = model.vocabulary;
      this.log_prior = model.log_prior;
      this.log_likelihood = model.log_likelihood;
    } else {
      this.frequency = {}; // contains words (also objects) and inside each word, the frecuency of that word in each class
      this.class_names = [];
      this.vocabulary = [];
      this.log_prior = {}; // to save log_prior of each class
      this.log_likelihood = {}; // la key prodria ser una palabra y adentro un objeto con las clases
    }
  }

  /* X sera un arrays de arrays, e y solo sera un array, ambos ya deben haber sido preprocesados */
  fit(X, y) {
    if (X.length != y.length)
      console.log("Error, the length of X and y are diferent.");

    // convert all the classes to string values (even if there are already strings)
    y = y.map(function (numero) {
      return numero.toString();
    });

    this.class_names = [...new Set(y)];
    const num_documents = X.length;

    // calculating frequency and vocabulary
    for (const [index, y_i] of y.entries()) {
      for (const word of X[index]) {
        if (!this.vocabulary.includes(word)) {
          this.vocabulary.push(word);
        }
        this.frequency[word] = this.frequency[word] ?? {};
        this.frequency[word][y_i] = (this.frequency[word]?.[y_i] ?? 0) + 1;
      }
    }

    for (const class_name of this.class_names) {
      const num_documents_class_name = y.filter(
        (item) => item === class_name
      ).length;

      this.log_prior[class_name] = Math.log(
        num_documents_class_name / num_documents
      );

      // calculating the denominator of log_likelihood
      let denominator = 0;
      for (const word of this.vocabulary) {
        denominator += this.frequency[word]?.[class_name] ?? 0;
      }
      denominator += this.vocabulary.length * this.laplace_smoothing;

      for (const word of this.vocabulary) {
        this.log_likelihood[word] = this.log_likelihood[word] ?? {};
        this.log_likelihood[word][class_name] =
          ((this.frequency[word]?.[class_name] ?? 0) + this.laplace_smoothing) /
          denominator;
      }
    }
  }

  predict(X) {
    const preds = [];

    for (const x of X) {
      let pred = null;
      const scores = {};

      for (const class_name of this.class_names) {
        scores[class_name] = this.log_prior[class_name]; // log prior is generating incorrect clasification, so it appear that i need a a uniform distribution of data 50%, 50%

        for (const word of x) {
          if (this.vocabulary.includes(word)) {
            scores[class_name] += this.log_likelihood[word][class_name];
          }
        }
      }
      // console.log("scores -> ", scores);

      const max_probability = Math.max(...Object.values(scores));
      pred = Object.keys(scores).find((key) => scores[key] === max_probability);

      // modifying: reduce false positive rate
      let olgura = 1.0; // 1 is default, but a good value is around 1.03
      pred = "0";
      if (scores["0"] / scores["1"] > olgura) {
        pred = "1";
      }

      preds.push(pred);
    }

    return preds;
  }

  /**
   * Creates a new MultinomialNB model fron the givin json file, static method, I can be call without any instance
   * @param {string} filename Filename of model in .json format
   * @returns {MultinomialNB}
   */

  static load(model) {
    return new MultinomialNB(model);
  }
}
