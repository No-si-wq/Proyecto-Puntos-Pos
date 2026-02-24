import "./config/env"

import { app } from "./app";
import { ENV } from "./config/env";
import { logger } from "./config/logger";

app.listen(ENV.PORT, "0.0.0.0", () => {
  logger.info(`API running on port ${ENV.PORT}`);
});