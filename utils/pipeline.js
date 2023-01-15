import stream from 'stream';
import util from 'util';

const pipeline = util.promisify(stream.pipeline);

export default pipeline;
