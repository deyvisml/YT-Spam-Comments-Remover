class PorterStemmerEN {
  // denote groups of consecutive consonants with a C and consecutive vowels
  // with a V.
  categorizeGroups(token) {
    return token
      .replace(/[^aeiouy]+y/g, "CV")
      .replace(/[aeiou]+/g, "V")
      .replace(/[^V]+/g, "C");
  }

  // denote single consonants with a C and single vowels with a V
  categorizeChars(token) {
    return token
      .replace(/[^aeiouy]y/g, "CV")
      .replace(/[aeiou]/g, "V")
      .replace(/[^V]/g, "C");
  }

  // calculate the "this.measure" M of a word. M is the count of VC sequences dropping
  // an initial C if it exists and a trailing V if it exists.
  measure(token) {
    if (!token) {
      return -1;
    }

    return (
      this.categorizeGroups(token).replace(/^C/, "").replace(/V$/, "").length /
      2
    );
  }

  // determine if a token end with a double consonant i.e. happ
  endsWithDoublCons(token) {
    return token.match(/([^aeiou])\1$/);
  }

  // replace a pattern in a word. if a replacement occurs an optional callback
  // can be called to post-process the result. if no match is made NULL is
  // returned.
  attemptReplace(token, pattern, replacement, callback) {
    let result = null;

    if (
      typeof pattern === "string" &&
      token.substr(0 - pattern.length) === pattern
    ) {
      result = token.replace(new RegExp(pattern + "$"), replacement);
    } else if (pattern instanceof RegExp && token.match(pattern)) {
      result = token.replace(pattern, replacement);
    }

    if (result && callback) {
      return callback(result);
    } else {
      return result;
    }
  }

  // attempt to replace a list of patterns/replacements on a token for a minimum
  // this.measure M.
  attemptReplacePatterns(token, replacements, measureThreshold) {
    let replacement = token;

    for (let i = 0; i < replacements.length; i++) {
      if (
        measureThreshold == null ||
        this.measure(
          this.attemptReplace(token, replacements[i][0], replacements[i][1])
        ) > measureThreshold
      ) {
        replacement =
          this.attemptReplace(
            replacement,
            replacements[i][0],
            replacements[i][2]
          ) || replacement;
      }
    }

    return replacement;
  }

  // replace a list of patterns/replacements on a word. if no match is made return
  // the original token.
  replacePatterns(token, replacements, measureThreshold) {
    return (
      this.attemptReplacePatterns(token, replacements, measureThreshold) ||
      token
    );
  }

  // TODO: this should replace all of the messy replacement stuff above
  replaceRegex(token, regex, includeParts, minimumMeasure) {
    let parts;
    let result = "";

    if (regex.test(token)) {
      parts = regex.exec(token);

      includeParts.forEach((i) => {
        result += parts[i];
      });
    }

    if (this.measure(result) > minimumMeasure) {
      return result;
    }

    return null;
  }

  // step 1a as defined for the porter stemmer algorithm.
  step1a(token) {
    if (token.match(/(ss|i)es$/)) {
      return token.replace(/(ss|i)es$/, "$1");
    }

    if (
      token.substr(-1) === "s" &&
      token.substr(-2, 1) !== "s" &&
      token.length > 2
    ) {
      return token.replace(/s?$/, "");
    }

    return token;
  }

  // step 1b as defined for the porter stemmer algorithm.
  step1b(token) {
    let result;
    if (token.substr(-3) === "eed") {
      if (this.measure(token.substr(0, token.length - 3)) > 0) {
        return token.replace(/eed$/, "ee");
      }
    } else {
      result = this.attemptReplace(token, /(ed|ing)$/, "", (token) => {
        if (this.categorizeGroups(token).indexOf("V") >= 0) {
          result = this.attemptReplacePatterns(token, [
            ["at", "", "ate"],
            ["bl", "", "ble"],
            ["iz", "", "ize"],
          ]);

          if (result !== token) {
            return result;
          } else {
            if (this.endsWithDoublCons(token) && token.match(/[^lsz]$/)) {
              return token.replace(/([^aeiou])\1$/, "$1");
            }

            if (
              this.measure(token) === 1 &&
              this.categorizeChars(token).substr(-3) === "CVC" &&
              token.match(/[^wxy]$/)
            ) {
              return token + "e";
            }
          }

          return token;
        }

        return null;
      });

      if (result) {
        return result;
      }
    }

    return token;
  }

  // step 1c as defined for the porter stemmer algorithm.
  step1c(token) {
    const categorizedGroups = this.categorizeGroups(token);

    if (
      token.substr(-1) === "y" &&
      categorizedGroups.substr(0, categorizedGroups.length - 1).indexOf("V") >
        -1
    ) {
      return token.replace(/y$/, "i");
    }

    return token;
  }

  // step 2 as defined for the porter stemmer algorithm.
  step2(token) {
    token = this.replacePatterns(
      token,
      [
        ["ational", "", "ate"],
        ["tional", "", "tion"],
        ["enci", "", "ence"],
        ["anci", "", "ance"],
        ["izer", "", "ize"],
        ["abli", "", "able"],
        ["bli", "", "ble"],
        ["alli", "", "al"],
        ["entli", "", "ent"],
        ["eli", "", "e"],
        ["ousli", "", "ous"],
        ["ization", "", "ize"],
        ["ation", "", "ate"],
        ["ator", "", "ate"],
        ["alism", "", "al"],
        ["iveness", "", "ive"],
        ["fulness", "", "ful"],
        ["ousness", "", "ous"],
        ["aliti", "", "al"],
        ["iviti", "", "ive"],
        ["biliti", "", "ble"],
        ["logi", "", "log"],
      ],
      0
    );

    return token;
  }

  // step 3 as defined for the porter stemmer algorithm.
  step3(token) {
    return this.replacePatterns(
      token,
      [
        ["icate", "", "ic"],
        ["ative", "", ""],
        ["alize", "", "al"],
        ["iciti", "", "ic"],
        ["ical", "", "ic"],
        ["ful", "", ""],
        ["ness", "", ""],
      ],
      0
    );
  }

  // step 4 as defined for the porter stemmer algorithm.
  step4(token) {
    return (
      this.replaceRegex(
        token,
        /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,
        [1],
        1
      ) ||
      this.replaceRegex(token, /^(.+?)(s|t)(ion)$/, [1, 2], 1) ||
      token
    );
  }

  // step 5a as defined for the porter stemmer algorithm.
  step5a(token) {
    const m = this.measure(token.replace(/e$/, ""));

    if (
      m > 1 ||
      (m === 1 &&
        !(
          this.categorizeChars(token).substr(-4, 3) === "CVC" &&
          token.match(/[^wxy].$/)
        ))
    ) {
      token = token.replace(/e$/, "");
    }

    return token;
  }

  // step 5b as defined for the porter stemmer algorithm.
  step5b(token) {
    if (this.measure(token) > 1) {
      return token.replace(/ll$/, "l");
    }

    return token;
  }

  // perform full stemming algorithm on a single word
  stem(token) {
    if (token.length < 3) return token.toString();
    return this.step5b(
      this.step5a(
        this.step4(
          this.step3(
            this.step2(
              this.step1c(this.step1b(this.step1a(token.toLowerCase())))
            )
          )
        )
      )
    ).toString();
  }
}
