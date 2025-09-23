import React from "react";

interface BatchEvent {
  batchId: string;
  type: "COLLECTION" | "QUALITY_TEST" | "PROCESSING" | "MANUFACTURING";
  timestamp: string;
  data: any;
}

interface BatchTrackerProps {
  events: BatchEvent[];
}

const BatchTracker: React.FC<BatchTrackerProps> = ({ events }) => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">📦 Batch Timeline</h2>

      <div className="space-y-4">
        {events.map((event, idx) => (
          <div
            key={idx}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">
                {event.type.replace("_", " ")}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>

            {/* === Render Details by Event Type === */}
            {event.type === "COLLECTION" && (
              <div className="text-sm space-y-1">
                <p><strong>Herb Species:</strong> {event.data.herbSpecies}</p>
                <p><strong>Collector:</strong> {event.data.collector}</p>
                <p><strong>Weight:</strong> {event.data.weight} kg</p>
                <p><strong>Harvest Date:</strong> {event.data.harvestDate}</p>
                {event.data.location && (
                  <p>
                    <strong>Location:</strong> 
                    {event.data.location.latitude}, {event.data.location.longitude}
                  </p>
                )}
                <p><strong>Price/Unit:</strong> ₹{event.data.pricePerUnit}</p>
                <p><strong>Total Price:</strong> ₹{event.data.totalPrice}</p>
                <p><strong>Quality Grade:</strong> {event.data.qualityGrade}</p>
                {event.data.notes && (
                  <p><strong>Notes:</strong> {event.data.notes}</p>
                )}
                {event.data.images?.length > 0 && (
                  <div>
                    <strong>Images:</strong>
                    <div className="flex gap-2 mt-1">
                      {event.data.images.map((img: string, i: number) => (
                        <img
                          key={i}
                          src={img}
                          alt="herb"
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {event.type === "QUALITY_TEST" && (
              <div className="text-sm space-y-1">
                <p><strong>Lab:</strong> {event.data.labName}</p>
                <p><strong>Parameters:</strong> {event.data.parameters}</p>
                <p><strong>Results:</strong> {event.data.results}</p>
                {event.data.certificateUrl && (
                  <a
                    href={event.data.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            )}

            {event.type === "PROCESSING" && (
              <div className="text-sm space-y-1">
                <p><strong>Processor:</strong> {event.data.processor}</p>
                <p><strong>Steps:</strong> {event.data.steps}</p>
                <p><strong>Output:</strong> {event.data.output}</p>
              </div>
            )}

            {event.type === "MANUFACTURING" && (
              <div className="text-sm space-y-1">
                <p><strong>Manufacturer:</strong> {event.data.manufacturer}</p>
                <p><strong>Product:</strong> {event.data.product}</p>
                <p><strong>Batch Size:</strong> {event.data.batchSize}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchTracker;
