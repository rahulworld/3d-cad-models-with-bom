import React from "react";
import { Accordion, Button, Form } from "react-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const SideBar = ({
  rawModel,
  uncheckedMeshes,
  setUncheckedMeshes,
  onClickReset,
  setHoveredIndex,
  hoveredIndex,
}) => (
  <>
    {rawModel.root.children.length > 0 &&
      rawModel.root.children.map((mesh, index) => (
        <div className="p-16">
          <Row>
            <Col>
              <p className="fw-bold fs-3 mt-16">{mesh.name}</p>
            </Col>
            <Col>
              <Button variant="primary" onClick={onClickReset}>
                Reset
              </Button>
            </Col>
          </Row>
          <div className="mb-16" />
          {mesh?.children.length > 0 &&
            mesh.children.map((meshItem, index) => (
              <Accordion>
                <Accordion.Item>
                  <Accordion.Header>{meshItem.name}</Accordion.Header>
                  <Accordion.Body
                    key={`meshItem${index}`}
                    className="bg-secondary-subtle"
                  >
                    {meshItem?.meshes.length > 0 &&
                      meshItem.meshes.map((meshChildItem, index) => (
                        <div
                          style={{
                            backgroundColor:
                              hoveredIndex === meshChildItem
                                ? "#74789d"
                                : "transparent",
                            paddingLeft: 16,
                            borderRadius: 5,
                          }}
                          onMouseEnter={() => {
                            setHoveredIndex(meshChildItem);
                          }}
                          onMouseLeave={() => {
                            setHoveredIndex(-1);
                          }}
                          onClick={() => {
                            let meshes = uncheckedMeshes;
                            if (!meshes.includes(meshChildItem)) {
                              meshes.push(meshChildItem);
                            } else {
                              const meshIndex = meshes.indexOf(meshChildItem);
                              if (meshIndex > -1) {
                                meshes.splice(meshIndex, 1);
                              }
                            }
                            setUncheckedMeshes(meshes);
                          }}
                        >
                          <Form.Check
                            key={`meshChildItem${meshChildItem}`}
                            type={"checkbox"}
                            defaultChecked={
                              !uncheckedMeshes.includes(meshChildItem)
                            }
                            id={`meshItem${meshChildItem}${index}`}
                            label={`${meshItem.name} ${meshChildItem}`}
                          />
                        </div>
                      ))}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            ))}
        </div>
      ))}
  </>
);

export default React.memo(SideBar);
