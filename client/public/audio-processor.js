class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 4096;
    this._buffer = new Float32Array(this._bufferSize);
    this._bytesWritten = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      
      // Fill buffer
      if (this._bytesWritten + channelData.length > this._bufferSize) {
        // Buffer is full, send it
        const remainingSpace = this._bufferSize - this._bytesWritten;
        this._buffer.set(channelData.subarray(0, remainingSpace), this._bytesWritten);
        this.port.postMessage(this._buffer.slice()); // Send copy
        
        // Start new buffer with rest
        this._bytesWritten = 0;
        this._buffer.set(channelData.subarray(remainingSpace), 0);
        this._bytesWritten += channelData.length - remainingSpace;
      } else {
        this._buffer.set(channelData, this._bytesWritten);
        this._bytesWritten += channelData.length;
      }
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);