"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FORM_ELEMENTS_SELECTOR = 'input, textarea, select';
/**
 * A single class to encapsulate all DOM operations that need to be performed to
 * capture the customer's application state.
 *
 */
class DOM {
    constructor(dom, options) {
        this.defaultDoctype = '<!DOCTYPE html>';
        this.originalDOM = dom;
        this.options = options || {};
        this.clonedDOM = this.cloneDOM();
    }
    /**
     * Returns the final DOM string with all of the necessary transforms
     * applied. This is the string that is passed to the API and then rendered by
     * our API.
     *
     */
    snapshotString() {
        // any since the cloned DOMs type can shift
        let dom = this.clonedDOM;
        const doctype = this.getDoctype();
        // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
        // For example, if your test suite runs tests in an element inside a page that
        // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
        // the full page. Using a dom transformation is how you'd achieve that.
        if (this.options.domTransformation) {
            try {
                dom = this.options.domTransformation(dom);
            }
            catch (error) {
                console.error('Could not transform the dom: ', error);
            }
        }
        return doctype + dom.outerHTML;
    }
    getDoctype() {
        return this.clonedDOM.doctype
            ? this.doctypeToString(this.clonedDOM.doctype)
            : this.defaultDoctype;
    }
    doctypeToString(doctype) {
        const publicDeclaration = doctype.publicId
            ? ` PUBLIC "${doctype.publicId}" `
            : '';
        const systemDeclaration = doctype.systemId
            ? ` SYSTEM "${doctype.systemId}" `
            : '';
        return (`<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>');
    }
    /**
     * Takes the raw DOM from the snapshot, performs necessary mutations,
     * and finally returns a deep clone of the original DOM.
     *
     */
    cloneDOM() {
        this.mutateOriginalDOM();
        // Any because its type changes when given to `stabilizeDOM`
        let clone = this.originalDOM.cloneNode(true);
        clone = this.stabilizeDOM(clone);
        return clone;
    }
    /**
     * Serialize parts of the DOM that aren't preserved in a deep clone. Anything
     * that is not encoded in the DOM tree needs to be accounted for here (CSSOM,
     * input values, canvas, etc).
     *
     * This method should always capture these values from the original DOM and
     * serialize (mutate) into the cloned DOM. Never mutate the original DOM.
     *
     */
    stabilizeDOM(clonedDOM) {
        this.serializeInputElements(clonedDOM);
        // We only want to serialize the CSSOM if JS isn't enabled.
        if (!this.options.enableJavaScript) {
            this.serializeCSSOM(clonedDOM);
        }
        return clonedDOM.documentElement;
    }
    /**
     * Capture in-memory form element values and serialize those values to their
     * respective elements in the cloned DOM.
     *
     * Form element values for non-controlled elements won't be captured with a
     * domClone. To fix this, we explicitly set the `value` attribute on those
     * form controls to make sure they persist in snapshots.
     *
     */
    serializeInputElements(clonedDOM) {
        const formNodes = this.originalDOM.querySelectorAll(FORM_ELEMENTS_SELECTOR);
        const formElements = Array.from(formNodes);
        formElements.forEach((elem) => {
            const inputId = elem.getAttribute('data-percy-element-id');
            const selector = `[data-percy-element-id="${inputId}"]`;
            const cloneEl = clonedDOM.querySelector(selector);
            switch (elem.type) {
                case 'checkbox':
                case 'radio':
                    if (elem.checked) {
                        cloneEl.setAttribute('checked', '');
                    }
                    break;
                case 'select-one':
                    if (elem.selectedIndex !== -1) {
                        cloneEl.options[elem.selectedIndex].setAttribute('selected', 'true');
                    }
                    break;
                case 'select-multiple':
                    const selectedOptions = Array.from(elem.selectedOptions);
                    const clonedOptions = Array.from(cloneEl.options);
                    if (selectedOptions.length) {
                        selectedOptions.forEach((option) => {
                            const matchingOption = clonedOptions
                                .find((cloneOption) => option.text === cloneOption.text);
                            matchingOption.setAttribute('selected', 'true');
                        });
                    }
                    break;
                case 'textarea':
                    // setting text or value does not work but innerHTML does
                    cloneEl.innerHTML = elem.value;
                    break;
                default:
                    cloneEl.setAttribute('value', elem.value);
            }
        });
    }
    /**
     * Capture in-memory styles & serialize those styles into the cloned DOM.
     *
     * Without this, applications that use packages like `styled-components` will be
     * missing styles and appear broken. The CSSOM provides a way to create CSS
     * that only lives in memory (not an asset or in the DOM).
     *
     */
    serializeCSSOM(documentClone) {
        const styleSheets = Array.from(this.originalDOM.styleSheets);
        styleSheets.forEach((styleSheet) => {
            // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
            // and isn't already in the DOM.
            function isCSSOM() {
                const hasHref = styleSheet.href;
                const ownerNode = styleSheet.ownerNode;
                const hasStyleInDom = ownerNode.innerText && ownerNode.innerText.length > 0;
                return !hasHref && !hasStyleInDom && styleSheet.cssRules;
            }
            if (isCSSOM()) {
                const $style = documentClone.createElement('style');
                const cssRules = Array.from(styleSheet.cssRules);
                const serializedStyles = cssRules.reduce((prev, cssRule) => {
                    return prev + cssRule.cssText;
                }, '');
                // Append the serialized styles to the cloned document
                $style.type = 'text/css';
                $style.setAttribute('data-percy-cssom-serialized', 'true');
                $style.innerHTML = serializedStyles;
                // TODO, it'd be better if we appended it right after the ownerNode in the clone
                documentClone.head.appendChild($style);
            }
        });
    }
    /**
     * A single place to mutate the original DOM. This should be the last resort!
     * This will change the customer's DOM and have a possible impact on the
     * customer's application.
     *
     */
    mutateOriginalDOM() {
        function createUID($el) {
            const ID = `_${Math.random().toString(36).substr(2, 9)}`;
            $el.setAttribute('data-percy-element-id', ID);
        }
        const formNodes = this.originalDOM.querySelectorAll(FORM_ELEMENTS_SELECTOR);
        const formElements = Array.from(formNodes);
        // loop through each form element and apply an ID for serialization later
        formElements.forEach((elem) => {
            if (!elem.getAttribute('data-percy-element-id')) {
                createUID(elem);
            }
        });
    }
}
exports.default = DOM;
