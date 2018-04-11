export default class SnapshotService {
  createSnapshot(
    name: string,
    enableJavascript?: boolean,
    widths?: number[],
    minimumHeight?: number,
  ): boolean {
    console.log(
      'CREATING SNAPSHOT\n' +
      `name: ${name}\n` +
      `enableJavascript: ${enableJavascript}.\n` +
      `widths: ${widths}.\n` +
      `minimumHeight: ${minimumHeight}\n`
    )
    // Something like this is to be sent to api
    // {
    //   'data' => {
    //     'type' => 'snapshots',
    //       'attributes' => {
    //       'name' => '/foo/test.html (test name)',
    //     },
    //     'relationships' => {
    //       'resources' => {
    //         'data' => [
    //           {
    //             'type' => 'resources',
    //             'id' => html_sha,
    //             'attributes' => {
    //               'resource-url' => '/foo/test.html',
    //                 'mimetype' => 'text/html',
    //                   'is-root' => true,
    //             },
    //           },
    //           {
    //             'type' => 'resources',
    //             'id' => css_sha,
    //             'attributes' => {
    //               'resource-url' => 'http://localhost:8080/css/test.css',
    //             },
    //           },
    //         ],
    //       },
    //     },
    //   },
    // }

    return true
  }
}
