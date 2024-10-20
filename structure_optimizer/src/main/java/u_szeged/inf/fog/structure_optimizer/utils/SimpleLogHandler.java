package u_szeged.inf.fog.structure_optimizer.utils;

import java.util.function.Consumer;
import java.util.logging.Handler;
import java.util.logging.LogRecord;

public class SimpleLogHandler extends Handler {

    private final Consumer<LogRecord> handler;

    public SimpleLogHandler(Consumer<LogRecord> handler) {
        this.handler = handler;
    }

    @Override
    public void publish(LogRecord record) {
        handler.accept(record);
    }

    @Override
    public void flush() {

    }

    @Override
    public void close() throws SecurityException {

    }
}
