import { Transform } from 'stream';

export default class JsonReporter extends Transform {
  constructor() {
    super({ writableObjectMode: true });

    this.currentNode = null;
    this.depth = 0; this.lastIndex = 0;
    this.depthMap = new Map();
    this.root = [];
  }

  add(data) {
    this.currentNode = this.root;
    for (let i = 0; i < data.depth; i++) {
      this.currentNode = this.currentNode[this.currentNode.length - 1].children;
    }
    this.lastIndex = this.currentNode.push({ ...data, children: [] });
    this.depthMap.set(data.depth, this.currentNode[this.lastIndex - 1]);
  }

  merge(data) { 
    Object.assign(this.depthMap.get(data.depth), data); 
  }

  _transform(event, encoding, callback) {
    event.data.depth = event.data.nesting; 
    delete event.data.nesting;
    if (event.data?.testNumber) {
      event.data.testNumber = parseInt(event.data.testNumber)
    };
    if (event.data?.details && Object.keys(event.data.details).length === 0) {
      delete event.data.details
    };

    switch (true) {
      case (event.data?.skip !== undefined): event.data.status = "skipped"; break;
      case (event.data?.todo !== undefined): event.data.status = "todo"; break;
      default: event.data.status = `${event.type.replace(`test:`, ``)}ed`;
    }

    switch (event.type) {
      case 'test:start':
        this.add(event.data);
        callback(null, ''); break;
      case 'test:pass':
      case 'test:fail':
        if (event.data?.details?.error) {
          event.data.error = JSON.parse(JSON.stringify(event.data.details.error));	// These values are not copyable: [stack], cause.[stack] cause.[message] cause.[name], [message]
          event.data.error.stack = event.data.details.error.stack;
          event.data.error.message = event.data.details.error.message.replaceAll("\n", " ").trim();
          event.data.error.cause.stack = event.data.details.error.cause.stack;
          event.data.error.cause.message = event.data.details.error.cause.message.replaceAll("\n", " ").trim();
          event.data.error.cause.name = event.data.details.error.cause.name;
          delete event.data.details.error;

          if (event.data?.details?.name) {
            event.data.error.errorName = event.data?.details?.name;
            delete event.data?.details?.name;
          }
        }

        (event.data?.details && Object.keys(event.data.details).length === 0) ? delete event.data.details : null;

        this.merge(event.data);

        callback(null, '');
        break;
      case 'test:diagnostic':
        callback(null, JSON.stringify(this.root, null, 2));
      default: 
        callback(null, '');
    }
  }

  _flush(callback) {
    callback(null, JSON.stringify(this.root, null, 2));
  }
}
