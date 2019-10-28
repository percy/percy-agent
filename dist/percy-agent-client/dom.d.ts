export interface DOMOptions {
    enableJavaScript?: boolean;
    domTransformation?: (dom: HTMLDocument) => void;
}
/**
 * A single class to encapsulate all DOM operations that need to be performed to
 * capture the customer's application state.
 *
 */
declare class DOM {
    originalDOM: HTMLDocument;
    clonedDOM: HTMLDocument;
    options: DOMOptions;
    readonly defaultDoctype = "<!DOCTYPE html>";
    constructor(dom: HTMLDocument, options?: DOMOptions);
    /**
     * Returns the final DOM string with all of the necessary transforms
     * applied. This is the string that is passed to the API and then rendered by
     * our API.
     *
     */
    snapshotString(): string;
    private getDoctype;
    private doctypeToString;
    /**
     * Takes the raw DOM from the snapshot, performs necessary mutations,
     * and finally returns a deep clone of the original DOM.
     *
     */
    private cloneDOM;
    /**
     * Serialize parts of the DOM that aren't preserved in a deep clone. Anything
     * that is not encoded in the DOM tree needs to be accounted for here (CSSOM,
     * input values, canvas, etc).
     *
     * This method should always capture these values from the original DOM and
     * serialize (mutate) into the cloned DOM. Never mutate the original DOM.
     *
     */
    private stabilizeDOM;
    /**
     * Capture in-memory form element values and serialize those values to their
     * respective elements in the cloned DOM.
     *
     * Form element values for non-controlled elements won't be captured with a
     * domClone. To fix this, we explicitly set the `value` attribute on those
     * form controls to make sure they persist in snapshots.
     *
     */
    private serializeInputElements;
    /**
     * Capture in-memory styles & serialize those styles into the cloned DOM.
     *
     * Without this, applications that use packages like `styled-components` will be
     * missing styles and appear broken. The CSSOM provides a way to create CSS
     * that only lives in memory (not an asset or in the DOM).
     *
     */
    private serializeCSSOM;
    /**
     * A single place to mutate the original DOM. This should be the last resort!
     * This will change the customer's DOM and have a possible impact on the
     * customer's application.
     *
     */
    private mutateOriginalDOM;
}
export default DOM;
